import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import DateTime
from pydantic import EmailStr

from app.users.enums import TrustLevel, Language

if TYPE_CHECKING:
    from app.banking.models import Account, Transaction, PaymentRequest
    from app.auth.models import Invite
    # from app.listings.models import Listing 

class User(SQLModel, table=True):
    __tablename__ = "users"

    # Identity
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_code: str = Field(
        unique=True, 
        max_length=5, 
        nullable=False,
        description="Public 5-digit ID (e.g., A1000)."
    )
    email: EmailStr = Field(unique=True, max_length=255)
    password_hash: str
    
    # Real Name Policy (Immutable)
    first_name: str = Field(max_length=100)
    middle_name: Optional[str] = Field(default=None, max_length=100)
    last_name: str = Field(max_length=100)

    # Additional data
    address: str = Field(max_length=255)
    language: Language = Field(default=Language.EN)

    # Status
    is_verified: bool = Field(default=False)
    is_active: bool = Field(default=True)
    is_system_admin: bool = Field(default=False)

    # Reputation (Calculated by Banking Module)
    trust_level: TrustLevel = Field(default=TrustLevel.T1)
    total_time_earned: int = Field(default=0)

    # Metadata
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

    # ORM relationships
    # lisitngs: list["Listing"] = Relationship(back_populates="user")

    invites: list["Invite"] = Relationship(back_populates="user")

    accounts: list["Account"] = Relationship(back_populates="user")

    outgoing_tx: list["Transaction"] = Relationship(
        back_populates="sender",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "[Transaction.sender_id]" 
        }
    )
    incoming_tx: list["Transaction"] = Relationship(
        back_populates="receiver",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "[Transaction.receiver_id]"
        }
    )

    sent_requests: list["PaymentRequest"] = Relationship(
        back_populates="creditor",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "[PaymentRequest.creditor_id]"
        }
    )
    received_requests: list["PaymentRequest"] = Relationship(
        back_populates="debtor",
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "[PaymentRequest.debtor_id]"
        }
    )
