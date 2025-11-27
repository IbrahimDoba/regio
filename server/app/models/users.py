import uuid
from datetime import datetime, timezone

from pydantic import EmailStr
from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel, Relationship

from app.enums import TrustLevel

from .posts import Post
from .accounts import Account
from .transactions import Transaction
from .payment_requests import PaymentRequest


"""Base model with shared properties."""
class UserBase(SQLModel):
    user_code: str = Field(
        unique=True, 
        max_length=5,
        nullable=False,
        description="Public 5-digit ID identifying each user in the system providing up to 260,000 unique combinations."
    )

    email: EmailStr = Field(default=None, unique=True, max_length=255)
    first_name: str = Field(default=None, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str = Field(default=None, max_length=100)

    is_verified: bool = Field(default=False)
    is_system_admin: bool = False
    is_active: bool = Field(default=True)

    trust_level: TrustLevel = Field(default=TrustLevel.T1)
    total_time_earned: int = Field(default=0)


"""User database model"""
class User(UserBase, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password_hash: str

    # ORM relationships
    posts: list["Post"] = Relationship(back_populates="user")

    accounts: list["Account"] = Relationship(back_populates="user")

    outgoing_tx: list["Transaction"] = Relationship(
        back_populates="sender",
        sa_relationship_kwargs={"foreign_keys": "Transaction.sender_id"}
    )
    incoming_tx: list["Transaction"] = Relationship(
        back_populates="receiver",
        sa_relationship_kwargs={"foreign_keys": "Transaction.receiver_id"}
    )

    sent_requests: list["PaymentRequest"] = Relationship(
        back_populates="creditor",
        sa_relationship_kwargs={"foreign_keys": "PaymentRequest.creditor_id"}
    )
    received_requests: list["PaymentRequest"] = Relationship(
        back_populates="debtor",
        sa_relationship_kwargs={"foreign_keys": "PaymentRequest.debtor_id"}
    )

    # Database record timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), 
        nullable=False,
        sa_type=DateTime(timezone=True)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), 
        nullable=False,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc),
        }
    )

"""Validation and API models."""
# Properties to receive via API on creation
class UserCreate(UserBase):
    first_name: str = Field(default=None, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str = Field(default=None, max_length=100)

    # The only mandatory fields allowing the above to be blank for system admin account flexibility.
    email: EmailStr = Field(max_length=255)
    password: str = Field(
        min_length=8, 
        max_length=40, 
        regex=r"^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$"
    )

# Properties to receive via API on update
class UserUpdate(UserBase):
    first_name: str | None = Field(default=None, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    email: EmailStr | None = Field(default=None, max_length=255)
    is_verified: bool | None = Field(default=None)
    is_active: bool = Field(default=True)
    trust_level: TrustLevel | None = None

# Properties to receive via API for user self update; email only for now
class UserUpdateMe(SQLModel):
    email: str | None = Field(default=None, max_length=50)

# Properties to receive via API for a password change
class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)

# Properties to return via API
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime

class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int
