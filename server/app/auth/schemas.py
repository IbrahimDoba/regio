from typing import Optional
from pydantic import BaseModel, EmailStr

# TOKEN SCHEMAS
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str
    expires_in: int

class TokenPayload(BaseModel):
    sub: str | None = None
    type: str | None = None # "access" or "refresh"
    jti: str | None = None   # Unique Token Identifier for Blacklisting

# LOGIN SCHEMAS
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# INVITE SCHEMAS
class InviteCreate(BaseModel):
    max_uses: int = 1
    expires_in_days: Optional[int] = 7

class InvitePublic(BaseModel):
    code: str
    uses_left: int
    expires_at: Optional[str]
