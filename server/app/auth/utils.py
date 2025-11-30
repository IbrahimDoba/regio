from datetime import datetime, timedelta, timezone
from typing import Any
import jwt
import uuid

from app.auth.config import auth_settings


def create_access_token(subject: str | Any, expires_delta: timedelta = None) -> str:
    """
    Creates a short-lived JWT for API access.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=auth_settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject), 
        "type": "access",
        "jti": str(uuid.uuid4()) # Unique ID for blacklist checking
    }
    
    encoded_jwt = jwt.encode(to_encode, auth_settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def create_refresh_token(subject: str | Any) -> str:
    """
    Creates a long-lived JWT for refreshing access tokens.
    """
    expire = datetime.now(timezone.utc) + timedelta(days=auth_settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject), 
        "type": "refresh",
        "jti": str(uuid.uuid4())
    }
    
    encoded_jwt = jwt.encode(to_encode, auth_settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt
