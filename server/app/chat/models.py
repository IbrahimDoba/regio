import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, Text
from sqlmodel import Field, SQLModel


class ChatRoom(SQLModel, table=True):
    __tablename__ = "chat_rooms"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    listing_id: uuid.UUID = Field(index=True)
    listing_title: str = Field(max_length=255)
    buyer_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    seller_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    room_id: uuid.UUID = Field(foreign_key="chat_rooms.id", index=True)
    sender_id: uuid.UUID = Field(foreign_key="users.id")
    content: str
    # text | offer_accept | offer_reject | payment_request
    message_type: str = Field(default="text")
    # JSON string for payment request metadata etc.
    meta: Optional[str] = Field(default=None, sa_type=Text)
    is_read: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )
