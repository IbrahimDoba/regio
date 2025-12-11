from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import jwt
import uuid

from fastapi import Response

from app.core.config import settings
from app.auth.config import auth_settings


def create_access_token(subject: str | Any, expires_delta: timedelta = None) -> str:
    """
    Creates a short-lived JWT for API access.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=auth_settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": str(uuid.uuid4()),  # Unique ID for blacklist checking
    }

    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=auth_settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(subject: str | Any) -> str:
    """
    Creates a long-lived JWT for refreshing access tokens.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=auth_settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }

    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=auth_settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes a token to check claims. Verification handled by caller or library.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[auth_settings.ALGORITHM])


def set_refresh_cookie(response: Response, refresh_token: str):
    """
    Sets the secure HttpOnly cookie.
    """
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # Set to False only if testing on localhost via HTTP, but better to use HTTPS locally
        samesite="lax",
        max_age=auth_settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )
