from typing import TYPE_CHECKING
from decimal import Decimal
from datetime import datetime, timezone
import uuid

from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint, DateTime
from sqlalchemy import Numeric, Column

from ..enums import Currency

if TYPE_CHECKING:
    from .users import User


"""Base model with shared properties."""
class AccountBase(SQLModel):
    type: Currency
    balance_regio: Decimal = Field(
        default=0.00, 
        sa_column=Column(Numeric(10, 2), default=0.00)
    )
    balance_time: int = Field(default=0)
    version: int = Field(default=0) # For optimistic locking

"""Account database model"""
class Account(AccountBase, table=True):
    __tablename__ = "accounts"

    # Unique constraint on User + Currency Type to enforce one Account type instance per user
    __table_args__ = (UniqueConstraint("user_id", "type"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    user_id: uuid.UUID = Field(foreign_key="users.id")
    user: "User" = Relationship(back_populates="accounts")

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
    last_demurrage_calc: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), 
        nullable=False,
        sa_type=DateTime(timezone=True)
    )

"""Validation and API models."""
# Properties to receive via API on creation
class AccountCreate(AccountBase):
    user_id: uuid.UUID

# Properties to receive via API on update
class AccountUpdate(SQLModel):
    balance_regio: Decimal | None = None
    balance_time: int | None = None
    version: int | None = None

# Properties to return via API
class AccountPublic(AccountBase):
    id: uuid.UUID
    user_id: uuid.UUID
