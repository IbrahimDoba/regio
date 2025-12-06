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
    code: str = Field(unique=True, max_length=20, nullable=False)
    
    # Creator of the invite
    owner_id: uuid.UUID = Field(foreign_key="users.id", nullable=False)
    
    # Invite used by who?
    used_by_id: Optional[uuid.UUID] = Field(default=None, foreign_key="users.id")
    
    # Usage logic
    uses_left: int = Field(default=1)
    max_uses: int = Field(default=1)
    
    # Metadata
    expires_at: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        nullable=True
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    # Relationships
    owner: "User" = Relationship(
        back_populates="invites", 
        sa_relationship_kwargs={"foreign_keys": "[Invite.owner_id]"}
    )
    
    # Relationship to the user who consumed it
    used_by: Optional["User"] = Relationship(
        back_populates="code_used",
        sa_relationship_kwargs={"foreign_keys": "[Invite.used_by_id]"}
    )
