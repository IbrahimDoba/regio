import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlmodel import DateTime, Field, Numeric, Relationship, SQLModel

from app.banking.enums import Currency, PaymentStatus

if TYPE_CHECKING:
    from app.users.models import User


class Account(SQLModel, table=True):
    __tablename__ = "accounts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)

    type: Currency = Field(index=True)

    # Financials
    balance_time: int = Field(default=0)
    balance_regio: Decimal = Field(default=0, sa_type=Numeric(10, 2))

    # Optimistic Locking
    version: int = Field(default=0)

    # Demurrage tracking
    last_demurrage_calc: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )

    # ORM relationships
    user: "User" = Relationship(back_populates="accounts")


class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    sender_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    receiver_id: uuid.UUID = Field(foreign_key="users.id", index=True)

    amount_time: int = Field(default=0)
    amount_regio: Decimal = Field(default=0, sa_type=Numeric(10, 2))

    reference: Optional[str] = Field(default=None)
    payment_request_id: Optional[uuid.UUID] = Field(default=None, index=True)

    is_system_fee: bool = Field(default=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )

    # ORM relationships
    sender: "User" = Relationship(
        back_populates="outgoing_tx",
        sa_relationship_kwargs={"foreign_keys": "[Transaction.sender_id]"},
    )
    receiver: "User" = Relationship(
        back_populates="incoming_tx",
        sa_relationship_kwargs={"foreign_keys": "[Transaction.receiver_id]"},
    )


class PaymentRequest(SQLModel, table=True):
    __tablename__ = "payment_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign keys to users table
    creditor_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    debtor_id: uuid.UUID = Field(foreign_key="users.id", index=True)

    amount_time: int = Field(default=0)
    amount_regio: Decimal = Field(default=0, sa_type=Numeric(10, 2))

    description: Optional[str] = None
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)

    # Links to the executed transaction
    transaction_id: Optional[uuid.UUID] = Field(default=None)

    reminder_sent_at: Optional[datetime] = Field(
        default=None, sa_type=DateTime(timezone=True)
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )

    # ORM Relationships
    creditor: "User" = Relationship(
        back_populates="sent_requests",
        sa_relationship_kwargs={"foreign_keys": "[PaymentRequest.creditor_id]"},
    )
    debtor: "User" = Relationship(
        back_populates="received_requests",
        sa_relationship_kwargs={"foreign_keys": "[PaymentRequest.debtor_id]"},
    )
