from typing import Optional

from sqlmodel import SQLModel
from pydantic import Field, ConfigDict

# TOKEN SCHEMAS
class Token(SQLModel):
    """
    Internal token model used by the service.
    """
    access_token: str = Field(..., description="JWT access token string.")
    token_type: str = Field(default="bearer", description="Token type, currently 'bearer'.")
    refresh_token: Optional[str] = Field(default=None, description="JWT refresh token string (stored in cookie).")
    expires_in: int = Field(..., description="Expiration time in seconds.")

class TokenResponse(SQLModel):
    """
    Public response for login/refresh. 
    Note: Refresh token is typically sent via HttpOnly cookie, not in this body.
    """
    access_token: str = Field(..., description="The JWT access token.")
    token_type: str = Field(default="bearer", description="The token type (Bearer).")
    expires_in: int = Field(..., description="Expiration time in seconds.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        }
    )

class TokenPayload(SQLModel):
    """
    Decoded JWT payload structure.
    """
    sub: str | None = Field(default=None, description="Subject (User ID).")
    type: str | None = Field(default=None, description="Token type ('access' or 'refresh').")
    jti: str | None = Field(default=None, description="Unique Token Identifier (used for blacklisting/revocation).")

# INVITE SCHEMAS
class InvitePublic(SQLModel):
    """
    Public details of an invite code.
    """
    code: str = Field(..., description="The unique invite code string.")
    uses_left: int = Field(..., description="Number of times this code can still be used.")
    expires_at: Optional[str] = Field(default=None, description="ISO timestamp when the invite expires (currently not used).")
    
    # Tracking info
    is_used: bool = Field(..., description="True if the code has been fully consumed/depleted.")
    used_by_name: Optional[str] = Field(default=None, description="Display name of the user who used this code (if applicable).")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "REGIO-AB-1234CDEF",
                "uses_left": 1,
                "expires_at": "2024-12-31T23:59:59",
                "is_used": False,
                "used_by_name": None
            }
        }
    )
