import uuid
from datetime import datetime
from typing import Optional
from pydantic import EmailStr, BaseModel, Field
from app.users.enums import TrustLevel


"""Base model with shared properties."""
class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True
    is_verified: bool = False
    trust_level: TrustLevel = TrustLevel.T1

"""Validation and API models."""
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    invite_code: str
    address: str

class UserUpdate(BaseModel):
    """
    Fields that user can update themselves.
    """
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    address: Optional[str] = None
    language: Optional[str] = None

class UserAdminUpdate(UserUpdate):
    """
    Fields only admins can touch.
    """
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    trust_level: Optional[TrustLevel] = None
    first_name: Optional[str] = None 
    last_name: Optional[str] = None

# Properties to return via API
class UserPublic(BaseModel):
    user_code: str
    email: EmailStr
    first_name: str
    middle_name: Optional[str]
    last_name: str
    trust_level: TrustLevel
    created_at: datetime

    class Config:
        from_attributes = True

class UsersPublic(BaseModel):
    data: list[UserPublic]
    count: int
