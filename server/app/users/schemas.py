from datetime import datetime
from typing import Any, Optional

from pydantic import ConfigDict, EmailStr, Field, field_validator
from sqlmodel import SQLModel

from app.users.enums import TrustLevel, VerificationStatus

"""Base model with shared properties."""


class UserBase(SQLModel):
    email: EmailStr = Field(..., description="Unique email address of the user.")
    is_active: bool = Field(
        default=True, description="Whether the account is active or disabled."
    )
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
    address: Optional[str] = Field(
        default=None, description="Physical address of user."
    )

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

    # Profile updates
    avatar_url: Optional[str] = Field(default=None, description="URL to profile image.")
    bio: Optional[str] = Field(
        default=None, max_length=500, description="Short about me."
    )

    # Notification Settings
    notif_email_digest: Optional[bool] = Field(
        default=None, description="Receive email digest."
    )
    notif_push: Optional[bool] = Field(
        default=None, description="Receive push notifications."
    )
    notif_newsletter: Optional[bool] = Field(
        default=None, description="Receive newsletter."
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
    is_system_admin: Optional[bool] = Field(
        default=None, description="Grant/revoke system admin privileges."
    )
    verification_status: Optional[VerificationStatus] = Field(
        default=None, description="Manual override of verification status."
    )
    trust_level: Optional[TrustLevel] = Field(
        default=None, description="Manual override of trust level."
    )
    total_time_earned: Optional[int] = Field(
        default=None, description="Manual adjustment of total time earned."
    )
    first_name: Optional[str] = Field(
        default=None, description="Correction of real name."
    )
    last_name: Optional[str] = Field(
        default=None, description="Correction of real name."
    )


# Properties to return via API
class UserPublic(SQLModel):
    user_code: str = Field(..., description="Public 5-digit unique ID (e.g. B4444).")
    email: EmailStr = Field(..., description="User's email address.")
    first_name: str = Field(..., description="First name.")
    middle_name: Optional[str] = Field(default=None, description="Middle name.")
    last_name: str = Field(..., description="Last name.")
    full_name: str = Field(
        ..., description="Full name derived from first, middle, and last names."
    )

    # Profile & Bio
    avatar_url: Optional[str] = Field(default=None, description="URL to profile image.")
    bio: Optional[str] = Field(default=None, description="Short about me.")
    address: Optional[str] = Field(..., description="User's physical address.")
    language: Optional[str] = Field(
        ..., description="User's preferred interface language (EN, DE, HU)."
    )

    # Status & Privileges
    is_active: bool = Field(..., description="Whether account is active.")
    is_system_admin: bool = Field(..., description="Whether user is a system admin.")
    verification_status: VerificationStatus = Field(
        ..., description="Identity verification status."
    )
    verified_at: datetime | None = Field(
        None, description="Timestamp at which user was verified."
    )
    verified_by: str | None = Field(
        None, description="Name of admin that verified this user."
    )

    # Reputation & Gamification
    trust_level: TrustLevel = Field(..., description="Current trust level.")
    total_time_earned: int = Field(..., description="Total time currency earned.")

    # Settings
    notif_email_digest: bool = Field(..., description="Setting: Email digest.")
    notif_push: bool = Field(..., description="Setting: Push notifications.")
    notif_newsletter: bool = Field(..., description="Setting: Newsletter.")

    created_at: datetime = Field(..., description="Account creation timestamp.")

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "user_code": "B4444",
                "email": "jane@example.com",
                "first_name": "Jane",
                "last_name": "Doe",
                "is_active": True,
                "is_system_admin": False,
                "verification_status": "PENDING",
                "verification_at": "2024-01-05T12:00:00Z",
                "verification_by": "Markus Messemmer",
                "trust_level": "T1",
                "total_time_earned": 125,
                "created_at": "2024-01-01T12:00:00Z",
            }
        },
    )

    @field_validator("verified_by", mode="before")
    @classmethod
    def extract_verifier_name(cls, v: Any) -> str | None:
        """
        Extracts the full name of the 'verified_by' User object.
        """
        if v is None:
            return None

        # If v is a User object
        if hasattr(v, "full_name"):
            return v.full_name

        # If value is already a string (rare, I made it a User object)
        return str(v)


class UsersPublic(SQLModel):
    data: list[UserPublic] = Field(..., description="List of users.")
    count: int = Field(..., description="Total number of users matching the query.")
