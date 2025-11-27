from typing import TYPE_CHECKING
from decimal import Decimal
from datetime import datetime, timezone
import uuid

from sqlmodel import SQLModel, Field, Relationship, DateTime
from sqlalchemy import Numeric, Column
from ..enums import PaymentStatus

if TYPE_CHECKING:
    from .users import User


"""Base model with shared properties"""
class PaymentRequestBase(SQLModel):
    amount_time: int = Field(default=0)
    amount_regio: Decimal = Field(
        default=0.00, 
        sa_column=Column(Numeric(10, 2), default=0.00)
    )
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    description: str | None = None
    reminder_sent_at: datetime | None = None
    transaction_id: uuid.UUID | None = None # Link to eventual transaction

"""PaymentRequest database model"""
class PaymentRequest(PaymentRequestBase, table=True):
    __tablename__ = "payment_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign keys
    creditor_id: uuid.UUID = Field(foreign_key="users.id")
    debtor_id: uuid.UUID = Field(foreign_key="users.id")

    # ORM relationships
    creditor: "User" = Relationship(
        back_populates="sent_requests",
        sa_relationship_kwargs={"foreign_keys": "PaymentRequest.creditor_id"}
    )
    debtor: "User" = Relationship(
        back_populates="received_requests",
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
class PaymentRequestCreate(PaymentRequestBase):
    creditor_id: uuid.UUID
    debtor_id: uuid.UUID

# Properties to receive via API on update
class PaymentRequestUpdate(SQLModel):
    status: PaymentStatus | None = None
    description: str | None = None
    reminder_sent_at: datetime | None = None

# Properties to return via API
class PaymentRequestPublic(PaymentRequestBase):
    id: uuid.UUID
    creditor_id: uuid.UUID
    debtor_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
