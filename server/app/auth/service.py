import uuid
import string
import random
from typing import Optional, List
from datetime import datetime, timezone

import jwt
from sqlmodel import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis 

from app.core.config import settings

from app.auth.config import auth_settings
from app.auth.security import verify_password
from app.users.models import User
from app.users.enums import VerificationStatus
from app.auth.models import Invite
from app.auth.schemas import Token, InvitePublic
from app.auth.utils import create_access_token, create_refresh_token, decode_token
from app.auth.exceptions import (
    InvalidCredentials, 
    AccountInactive, 
    InvalidInviteCode, 
    InviteCodeDepleted,
    AccountNotVerified, 
    InvalidToken,
    RefreshTokenExpired
)

class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        # Initialize Redis for token blacklisting
        self.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def authenticate_user(self, email: str, password: str) -> Token:
        # Fetch User
        result = await self.session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        # Verify Identity (Timing attack safe)
        if not user or not verify_password(password, user.password_hash):
            raise InvalidCredentials()

        if not user.is_active:
            raise AccountInactive()
        
        if user.verification_status != VerificationStatus.VERIFIED:
            raise AccountNotVerified()

        # Generate Tokens
        return self._generate_tokens(user.id)

    def _generate_tokens(self, user_id: uuid.UUID) -> Token:
        """
        Generates an access and refresh token for the user.
        """
        access_token = create_access_token(subject=user_id)
        refresh_token = create_refresh_token(subject=user_id)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=auth_settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    async def _blacklist_token(self, token: str):
        """
        Adds a token's JTI to Redis blacklist with TTL equal to remaining expiry.
        """
        try:
            # Decode token and get JTI and expiration timestamp
            payload = decode_token(token)
            jti = payload.get("jti")
            exp = payload.get("exp")
            
            if jti and exp:
                now = datetime.now(timezone.utc).timestamp()
                ttl = int(exp - now) # Calculate time left for token to expire (Time To Live)
                if ttl > 0:
                    # Set blacklisted token in Redis with ttl as expiry time
                    await self.redis.setex(f"blacklist:{jti}", ttl, "true")
        except Exception:
            # Skip blacklisting if token is already invalid/expired
            pass

    async def _is_blacklisted(self, token: str) -> bool:
        """
        Checks if a token is blacklisted.
        """
        try:
            payload = decode_token(token)
            jti = payload.get("jti")
            if not jti:
                return False
            
            is_blacklisted = await self.redis.get(f"blacklist:{jti}")
            return is_blacklisted is not None
        except Exception:
            return True # Fail secure

    async def refresh_token(self, old_refresh_token: str) -> Token:
        """
        ROTATION LOGIC:
        1. Verify old refresh token.
        2. Check if blacklisted (Replay attack protection).
        3. Blacklist the old one.
        4. Issue new pair.
        """
        # Check Blacklist First
        if await self._is_blacklisted(old_refresh_token):
            raise InvalidToken("Token has been revoked")

        try:
            # Verify Signature & Expiry
            payload = decode_token(old_refresh_token)
            if payload.get("type") != "refresh":
                raise InvalidToken("Invalid token type")
            
            user_id = payload.get("sub")
            if not user_id:
                raise InvalidToken()

        except jwt.ExpiredSignatureError:
            raise RefreshTokenExpired()
        except jwt.InvalidTokenError:
            raise InvalidToken()

        # Rotate: Blacklist the old refresh token immediately
        await self._blacklist_token(old_refresh_token)

        # Issue new tokens
        return self._generate_tokens(uuid.UUID(user_id))

    async def logout(self, access_token: str, refresh_token: Optional[str]):
        """
        Secure Logout: Blacklist both the access token and the refresh token.
        """
        await self._blacklist_token(access_token)
        if refresh_token:
            await self._blacklist_token(refresh_token)
    
    async def get_user_invites(self, user_id: uuid.UUID) -> List[InvitePublic]:
        """
        Fetches all invite codes for the user (active and used).
        """
        # Fetch invites + load the user who used it if it has been used.
        statement = (
            select(Invite)
            .where(Invite.owner_id == user_id)
            .options(selectinload(Invite.used_by))
            .order_by(Invite.created_at.desc())
            .limit(3) # Limit to three most recent invites
        )
        result = await self.session.execute(statement)
        invites = result.scalars().all()
        
        # Map to Schema with "Used By" name logic
        public_invites = []
        for inv in invites:
            used_by_name = None
            if inv.used_by:
                used_by_name = inv.used_by.full_name

            public_invites.append(InvitePublic(
                code=inv.code,
                uses_left=inv.uses_left,
                expires_at=str(inv.expires_at) if inv.expires_at else None,
                is_used=inv.uses_left == 0,
                used_by_name=used_by_name
            ))
            
        return public_invites
    
    async def request_invites(self, user_id: uuid.UUID) -> List[InvitePublic]:
        """
        Fetches a user's unused invites, immediately renders them as used and creates 3 new ones.
        """
        # Fetch invites + load the user who used it if it has been used.
        statement = select(Invite).where(
            Invite.owner_id == user_id, 
            Invite.uses_left > 0 # Only invites that have been used
        )
        results = await self.session.execute(statement)
        active_invites = results.scalars().all()
        
        # Void all the active invites
        for inv in active_invites:
            inv.uses_left = 0
            # We do NOT set used_by_id, so used_by_name remains None 
            # (UI will see it as used/expired but without a name)
            self.session.add(inv)
            
        # Generate 3 new invites
        await self.create_user_invites(user_id)
        
        # Commit all changes
        await self.session.commit()
        
        # Return the fresh list (which will pick up the 3 new ones due to order_by desc)
        return await self.get_user_invites(user_id)

    async def consume_invite(self, code: str, consumer_id: uuid.UUID) -> Invite:
        """
        Validates, decrements, and links the invite code to the new user.
        """
        if code.casefold() == 'system'.casefold():
            raise InvalidInviteCode()

        statement = select(Invite).where(Invite.code == code)
        result = await self.session.execute(statement)
        invite = result.scalar_one_or_none()

        if not invite:
            raise InvalidInviteCode()

        if invite.uses_left <= 0:
            raise InviteCodeDepleted()

        # Update Logic
        invite.uses_left -= 1
        invite.used_by_id = consumer_id # Attach ID of user that used invite
        
        self.session.add(invite)
        # Note: Transaction commit handled by caller (UserService)
        
        return invite

    async def create_user_invites(self, user_id: uuid.UUID, amount: int = 3) -> None:
        """
        Generates welcome invites. Format: REGIO-AB-12345678 (Longer, harder to guess)
        """
        
        # Fetch user code prefix to personalize it slightly (optional, but requested context)
        # Or just use random. Let's use a standard format for uniformity.
        # Format: REGIO-{2 chars from ID}-{8 random chars}
        
        user_str = str(user_id).replace("-", "")
        prefix = user_str[:2].upper()
        
        for _ in range(amount):
            # 8 char random suffix
            suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            code = f"REGIO-{prefix}-{suffix}"
            
            invite = Invite(
                code=code,
                owner_id=user_id,
                uses_left=1,
                max_uses=1
            )
            self.session.add(invite)
        
        # Let the caller commit usually, but if called independently:
        # await self.session.commit()
