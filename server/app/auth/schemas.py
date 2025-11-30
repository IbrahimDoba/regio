from typing import Optional
from sqlmodel import SQLModel, EmailStr

# TOKEN SCHEMAS
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None 
    expires_in: int

class TokenPayload(SQLModel):
    sub: str | None = None
    type: str | None = None # "access" or "refresh"
    jti: str | None = None   # Unique Token Identifier for Blacklisting

# LOGIN SCHEMAS
class LoginRequest(SQLModel):
    email: EmailStr
    password: str

# INVITE SCHEMAS
class InviteCreate(SQLModel):
    max_uses: int = 1
    expires_in_days: Optional[int] = 7

class InvitePublic(SQLModel):
    code: str
    uses_left: int
    expires_at: Optional[str]
