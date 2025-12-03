import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any, Dict

from sqlmodel import Field, SQLModel, Relationship, JSON, Column
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB

from app.listings.enums import ListingCategory, ListingStatus

# Forward refs
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.users.models import User

class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, nullable=False)
    category_filter: Optional[str] = None
    
    is_official: bool = Field(default=False) # True = Admin/System Approved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Listing(SQLModel, table=True):
    __tablename__ = "listings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    
    category: ListingCategory = Field(index=True)
    status: ListingStatus = Field(default=ListingStatus.ACTIVE, index=True)

    # CONTENT (Translated)
    # We store the inputs here. AI Translation fills the others.
    title_original: str = Field(max_length=150)
    description_original: str = Field(sa_type=String) # Unlimited text
    
    # Translations (Populated by Service/Worker)
    title_en: Optional[str] = None
    title_de: Optional[str] = None
    title_hu: Optional[str] = None
    description_en: Optional[str] = None
    description_de: Optional[str] = None
    description_hu: Optional[str] = None

    # META
    # Storing tags as JSON list ["vegan", "bio"] for super fast filtering
    tags: List[str] = Field(default=[], sa_column=Column(JSONB)) 
    
    # List of URL strings
    media_urls: List[str] = Field(default=[], sa_column=Column(JSON))
    
    radius_km: int = Field(default=10)
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None

    # POLYMORPHIC ATTRIBUTES
    # Stores: time_factor, regio_amount, start_dest, waypoints, etc.
    # Queryable in Postgres via attributes->>'key'
    attributes: Dict[str, Any] = Field(default={}, sa_column=Column(JSONB))

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

    # Relationships
    owner: "User" = Relationship(back_populates="listings")
