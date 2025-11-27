import uuid
from typing import TYPE_CHECKING
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from .users import User


"""Base model with shared properties."""
class PostBase(SQLModel):
    title: str = Field(min_length=1, max_length=100, description="Post title.")
    description: str = Field(description="Long text for a post's description")
    tags: str | None = Field(
        default=None, description="A comma separated string of tags used to describe and categorize the post."
    )
    attachments: str

"""Post main database model"""
class Post(PostBase, table=True):
    __tablename__ = "posts"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign key to user
    user_id: uuid.UUID = Field(foreign_key="users.id")

    # ORM relationship to user
    user: "User" = Relationship(back_populates="posts")

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

"""Validation and API models"""
# Properties to receive via API on creation
class PostCreate(PostBase):
    pass

# Properties to receive via API for updating a post
class PostUpdate(PostBase):
    title: str | None = Field(
        default=None, min_length=1, max_length=100, description="Post title."
    )
    description: str = Field(description="Long text for a post's description")
    tags: str | None = Field(
        default=None, description="A comma separated string of tags used to describe and categorize the post."
    )

# Properties to return via API
class PostPublic(PostBase):
    id: uuid.UUID

class PostsPublic(SQLModel):
    data: list[PostPublic]
    count: int
