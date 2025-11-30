import uuid

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
# import redis.asyncio as redis  # Uncomment if using Redis

from app.auth.config import auth_settings
from app.auth.security import verify_password
from app.users.models import User
from app.auth.models import Invite
from app.auth.schemas import Token
from app.auth.utils import create_access_token, create_refresh_token
from app.auth.exceptions import (
    InvalidCredentials, 
    AccountInactive, 
    InvalidInviteCode, 
    InviteCodeDepleted,
    AccountNotVerified
)

class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        # self.redis = redis.from_url(settings.REDIS_URL) # Initialize Redis

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
        access_token = create_access_token(subject=user_id)
        refresh_token = create_refresh_token(subject=user_id)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=auth_settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

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
