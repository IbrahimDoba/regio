import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, Relationship, SQLModel

from app.users.enums import TrustLevel

if TYPE_CHECKING:
    from app.users.models import User


class Broadcast(SQLModel, table=True):
    """
    Stores the 'Master' message template sent by an admin.
    """

    __tablename__ = "broadcasts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    title: str = Field(max_length=255, nullable=False)
    body: str = Field(sa_type=Text, nullable=False)
    link: Optional[str] = Field(
        default=None, max_length=2048, description="Deep link or URL"
    )

    # ID of admin sending the broadcast
    sender_id: uuid.UUID = Field(foreign_key="users.id")

    # Stores ["T1", "T6"] strings in the DB.
    target_trust_levels: Optional[List[TrustLevel]] = Field(
        default=None,
        sa_type=ARRAY(String),
        description="List of trust levels targeted. Null means ALL users.",
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )

    # Relationships
    sender: "User" = Relationship(
        sa_relationship_kwargs={
            "lazy": "joined",
            "foreign_keys": "[Broadcast.sender_id]",
        }
    )

    recipients: List["UserBroadcast"] = Relationship(
        back_populates="broadcast",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class UserBroadcast(SQLModel, table=True):
    """
    The 'Inbox' item for a specific user.
    Links a User to a Broadcast and tracks read status.
    """

    __tablename__ = "user_broadcasts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    user_id: uuid.UUID = Field(
        foreign_key="users.id", index=True, nullable=False
    )
    broadcast_id: uuid.UUID = Field(
        foreign_key="broadcasts.id", nullable=False
    )

    is_read: bool = Field(default=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )

    # Relationships
    broadcast: "Broadcast" = Relationship(back_populates="recipients")

    user: "User" = Relationship(
        sa_relationship_kwargs={
            "lazy": "selectin",
            "foreign_keys": "[UserBroadcast.user_id]",
        }
    )
