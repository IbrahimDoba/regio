from typing import Optional

from pydantic import EmailStr
from sqlmodel import SQLModel

# TOKEN SCHEMAS
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None 
    expires_in: int

class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenPayload(SQLModel):
    sub: str | None = None
    type: str | None = None # "access" or "refresh"
    jti: str | None = None   # Unique Token Identifier for Blacklisting

# INVITE SCHEMAS
class InvitePublic(SQLModel):
    code: str
    uses_left: int
    expires_at: Optional[str]
    
    # Tracking info
    is_used: bool
    used_by_name: Optional[str] = None
