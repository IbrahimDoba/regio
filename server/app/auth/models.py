import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel, DateTime, Relationship

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.users.models import User


class Invite(SQLModel, table=True):
    __tablename__ = "invites"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(unique=True, max_length=10, nullable=False)
    
    # Foreign key to users table
    owner_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    
    # Usage logic
    uses_left: int = Field(default=1)
    max_uses: int = Field(default=1)
    
    # Metadata
    expires_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=False
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    user: "User" = Relationship(back_populates="invites")
