from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel
from pydantic import EmailStr, Field, ConfigDict

from app.users.enums import TrustLevel, VerificationStatus


"""Base model with shared properties."""


class UserBase(SQLModel):
    email: EmailStr = Field(..., description="Unique email address of the user.")
    is_active: bool = Field(
        default=True, description="Whether the account is active or disabled."
    )
    # is_verified: bool = False
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.PENDING,
        description="Current status of identity verification.",
    )
    trust_level: TrustLevel = Field(
        default=TrustLevel.T1, description="Calculated trust score/reputation level."
    )


"""Validation and API models."""


class UserCreate(SQLModel):
    email: EmailStr = Field(..., description="User's email address.")
    password: str = Field(
        min_length=8,
        description="Plain text password (hashed on server). Must be at least 8 chars.",
    )
    first_name: str = Field(..., description="User's real first name.")
    middle_name: Optional[str] = Field(
        default=None, description="User's real middle name (optional)."
    )
    last_name: str = Field(..., description="User's real last name.")
    invite_code: str = Field(
        ..., description="Valid invite code required for registration."
    )
    address: str = Field(..., description="Physical address for verification purposes.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "jane.doe@example.com",
                "password": "strongpassword123",
                "first_name": "Jane",
                "middle_name": "Marie",
                "last_name": "Doe",
                "invite_code": "INV-123",
                "address": "123 Maple Street, Berlin",
            }
        }
    )


class UserUpdate(SQLModel):
    """
    Fields that user can update themselves.
    """

    email: Optional[EmailStr] = Field(default=None, description="New email address.")
    password: Optional[str] = Field(default=None, description="New password.")
    address: Optional[str] = Field(
        default=None, description="Updated physical address."
    )
    language: Optional[str] = Field(
        default=None, description="Preferred interface language (EN, DE, HU)."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"address": "456 Oak Avenue, Munich", "language": "DE"}
        }
    )


class UserAdminUpdate(UserUpdate):
    """
    Fields only admins can touch.
    """

    is_active: Optional[bool] = Field(
        default=None, description="Force enable/disable account."
    )
    # is_verified: Optional[bool] = None
    verification_status: Optional[VerificationStatus] = Field(
        default=None, description="Manual override of verification status."
    )
    trust_level: Optional[TrustLevel] = Field(
        default=None, description="Manual override of trust level."
    )
    first_name: Optional[str] = Field(
        default=None, description="Correction of real name."
    )
    last_name: Optional[str] = Field(
        default=None, description="Correction of real name."
    )


# Properties to return via API
class UserPublic(SQLModel):
    user_code: str = Field(..., description="Public 5-digit unique ID (e.g. A1000).")
    email: EmailStr = Field(..., description="User's email address.")
    first_name: str = Field(..., description="First name.")
    middle_name: Optional[str] = Field(default=None, description="Middle name.")
    last_name: str = Field(..., description="Last name.")
    address: Optional[str] = Field(..., description="User's physical address.")
    language: Optional[str] = Field(
        ..., description="User's preferred interface language (EN, DE, HU)."
    )
    trust_level: TrustLevel = Field(..., description="Current trust level.")
    created_at: datetime = Field(..., description="Account creation timestamp.")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "user_code": "A1000",
                "email": "jane@example.com",
                "first_name": "Jane",
                "last_name": "Doe",
                "trust_level": "T1",
                "created_at": "2024-01-01T12:00:00Z",
            }
        },
    )


class UsersPublic(SQLModel):
    data: list[UserPublic] = Field(..., description="List of users.")
    count: int = Field(..., description="Total number of users matching the query.")
