from typing import TYPE_CHECKING
from decimal import Decimal
from datetime import datetime, timezone
import uuid

from sqlmodel import SQLModel, Field, Relationship, DateTime
from sqlalchemy import Numeric, Column

if TYPE_CHECKING:
    from .users import User


# Base model with shared properties.
class TransactionBase(SQLModel):
    amount_time: int = Field(default=0)
    amount_regio: Decimal = Field(
        default=0.00, 
        sa_column=Column(Numeric(10, 2), default=0.00)
    )
    reference: str | None = None
    # Store the ID of the payment request if it exists
    payment_request_id: str | None = Field(default=None, index=True)

# Transaction database model
class Transaction(TransactionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    """Foreign Keys"""
    sender_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    receiver_id: uuid.UUID = Field(foreign_key="users.id", index=True)

    """ORM relationship"""
    sender: "User" = Relationship(
        back_populates="outgoing_tx",
        sa_relationship_kwargs={"foreign_keys": "[Transaction.sender_id]"}
    )
    receiver: "User" = Relationship(
        back_populates="incoming_tx",
        sa_relationship_kwargs={"foreign_keys": "[Transaction.receiver_id]"}
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
class TransactionCreate(TransactionBase):
    sender_id: str
    receiver_id: str

# Properties to return via API
class TransactionPublic(TransactionBase):
    id: str
    created_at: datetime
    sender_id: str
    receiver_id: str
