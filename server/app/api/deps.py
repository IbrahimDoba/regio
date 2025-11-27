from typing import Annotated
from collections.abc import AsyncGenerator

import jwt
from pydantic import ValidationError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core import security
from app.core.db import engine
from app.core.config import settings
from app.models.users import User
from app.models.system import TokenPayload


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/login/access-token"
)

engine = create_async_engine(
    str(settings.SQLALCHEMY_DATABASE_URI), 
    echo=False, 
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


async def get_current_user_token_payload(token: TokenDep) -> TokenPayload:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError, ExpiredSignatureError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to validate credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return token_data

async def get_current_user(session: SessionDep, token: TokenDep) -> User:
    token_data = await get_current_user_token_payload(token)
    user = await session.get(User, token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_active_system_admin(current_user: CurrentUser) -> User:
    if not current_user.is_system_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Action disallowed by current user",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return current_user
