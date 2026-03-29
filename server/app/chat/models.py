import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, UniqueConstraint
from sqlmodel import Field, SQLModel


class MatrixUserCredentials(SQLModel, table=True):
    __tablename__ = "matrix_user_credentials"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", unique=True, index=True)
    access_token: str  # AES-256-CBC encrypted
    device_id: str
    home_server: str
    last_login_at: Optional[datetime] = Field(
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


class MatrixRoom(SQLModel, table=True):
    __tablename__ = "matrix_rooms"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    matrix_room_id: str = Field(unique=True, index=True)  # e.g. !abcdefg:151.hu
    listing_id: Optional[uuid.UUID] = Field(default=None, index=True)
    room_name: Optional[str] = Field(default=None, max_length=255)
    created_by_id: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )


class MatrixRoomParticipant(SQLModel, table=True):
    __tablename__ = "matrix_room_participants"
    __table_args__ = (UniqueConstraint("room_id", "user_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    room_id: uuid.UUID = Field(foreign_key="matrix_rooms.id", index=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    matrix_user_id: str  # e.g. @immo_<uuid>:151.hu


class MatrixRegistrationStats(SQLModel, table=True):
    __tablename__ = "matrix_registration_stats"

    id: int = Field(default=None, primary_key=True)
    users_created: int = Field(default=0)
    token_limit: int = Field(default=300)
    token_expiry: datetime = Field(sa_type=DateTime(timezone=True))
    last_updated: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )
