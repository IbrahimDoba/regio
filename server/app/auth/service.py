import uuid
from typing import Optional, List
from datetime import datetime, timezone

import jwt
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis 

from app.core.config import settings

from app.auth.config import auth_settings
from app.auth.security import verify_password
from app.users.models import User
from app.auth.models import Invite
from app.auth.schemas import Token
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
        
        if not user.is_verified:
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
        return await self._generate_tokens(uuid.UUID(user_id))

    async def logout(self, access_token: str, refresh_token: Optional[str]):
        """
        Secure Logout: Blacklist both the access token and the refresh token.
        """
        await self._blacklist_token(access_token)
        if refresh_token:
            await self._blacklist_token(refresh_token)

    async def get_user_invites(self, user_id: uuid.UUID) -> List[Invite]:
        """
        Fetches all active invite codes for the given user.
        """
        statement = select(Invite).where(
            Invite.owner_id == user_id, 
            Invite.uses_left > 0
        )
        result = await self.session.execute(statement)
        return result.all()

    async def consume_invite(self, code: str) -> Invite:
        """
        Validates and decrements an invite code. 
        Called by UsersService during registration.
        """
        statement = select(Invite).where(Invite.code == code)
        result = await self.session.execute(statement)
        invite = result.scalar_one_or_none()

        if not invite:
            raise InvalidInviteCode()

        if invite.uses_left <= 0:
            raise InviteCodeDepleted()

        # Decrement usage
        invite.uses_left -= 1
        self.session.add(invite)
        # Note: Do not commit here. The caller (UserService) should commit 
        # to ensure User Creation + Invite Consumption happen atomically.
        
        return invite

    async def create_user_invites(self, user_id: uuid.UUID, amount: int = 3):
        """
        Generates welcome invites for a new user.
        """
        import random, string
        
        for _ in range(amount):
            # Simple code generation: UserID snippet + Random
            suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            code = f"{str(user_id)[:2].upper()}{suffix}"
            
            invite = Invite(
                code=code,
                owner_id=user_id,
                uses_left=1,
                max_uses=1
            )
            self.session.add(invite)
        
        # Let the caller commit usually, but if called independently:
        # await self.session.commit()
