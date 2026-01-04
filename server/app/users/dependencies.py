from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.auth.config import auth_settings
from app.auth.schemas import TokenPayload
from app.core.config import settings
from app.core.database import SessionDep
from app.users.enums import VerificationStatus
from app.users.models import User
from app.users.service import UserService

# AUTH CONFIG
reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login/access-token")

TokenDep = Annotated[str, Depends(reusable_oauth2)]


# SERVICE DEPENDENCY
def get_user_service(session: SessionDep) -> UserService:
    """
    Dependency to get a UserService instance with an active AsyncSession.
    """
    return UserService(session)


UserServiceDep = Annotated[UserService, Depends(get_user_service)]


# USER RETRIEVAL DEPENDENCIES
async def get_current_user(session: SessionDep, token: TokenDep) -> User:
    """
    Decodes the JWT token and fetches the current user from the database.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[auth_settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, Exception):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # user = await session.get(User, token_data.sub)
    query = (
        select(User)
        .where(User.id == token_data.sub)
        .options(selectinload(User.verified_by))
    )
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    if user.verification_status != VerificationStatus.VERIFIED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_active_system_admin(current_user: CurrentUser) -> User:
    """
    Validates that the current user is a system admin.
    """
    if not current_user.is_system_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action disallowed by current user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


CurrentAdmin = Annotated[User, Depends(get_current_active_system_admin)]
