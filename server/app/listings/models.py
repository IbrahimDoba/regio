import uuid
from datetime import datetime, timezone

# Forward refs
from typing import TYPE_CHECKING, Any, Dict, List, Optional

import sqlalchemy as sa
from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import JSON, Column, Field, Relationship, SQLModel

from app.listings.enums import ListingCategory, ListingStatus

if TYPE_CHECKING:
    from app.users.models import User


class ZipDistance(SQLModel, table=True):
    """Pre-computed real driving distances between Hungarian ZIP codes (max 40 km)."""

    __tablename__ = "zip_distances"

    id: Optional[int] = Field(default=None, primary_key=True)
    zip_from: str = Field(
        sa_column=Column(String(10), nullable=False, index=True)
    )
    zip_to: str = Field(sa_column=Column(String(10), nullable=False))
    distance_km: int = Field(
        sa_column=Column(sa.SmallInteger(), nullable=False)
    )

    __table_args__ = (
        sa.Index("ix_zip_distances_zip_from_km", "zip_from", "distance_km"),
    )


class PostVisibility(SQLModel, table=True):
    """
    Junction table: which viewer ZIPs can see a given post.
    Populated at listing creation time for D1–D4 listings.
    D5/D6 listings skip this table — they are always visible.
    """

    __tablename__ = "post_visibilities"

    post_id: uuid.UUID = Field(
        sa_column=Column(
            sa.Uuid,
            sa.ForeignKey("listings.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        )
    )
    viewer_zip: str = Field(
        sa_column=Column(
            String(10), primary_key=True, nullable=False, index=True
        )
    )


class ZipRegistry(SQLModel, table=True):
    """Hungarian irányítószám → city/village name reference. Read-only after migration."""

    __tablename__ = "zip_registry"

    zip_code: str = Field(
        sa_column=Column(String(4), primary_key=True, nullable=False)
    )
    city_name: str = Field(
        sa_column=Column(String(200), primary_key=True, nullable=False)
    )

    __table_args__ = (sa.Index("ix_zip_registry_zip_code", "zip_code"),)


class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, nullable=False)

    # Translations
    name_de: Optional[str] = None
    name_en: Optional[str] = None
    name_hu: Optional[str] = None

    category_filter: Optional[str] = None

    is_official: bool = Field(
        default=False
    )  # False = User suggested (Pending), True = Approved
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )


class ListingTagLink(SQLModel, table=True):
    """Join table between listings and tags.

    Tags are referenced by id, never by name, so a listing cannot hold a
    language-specific label. Deleting a tag clears it from every listing
    through the FK cascade.
    """

    __tablename__ = "listing_tags"

    listing_id: uuid.UUID = Field(
        foreign_key="listings.id", primary_key=True, ondelete="CASCADE"
    )
    tag_id: int = Field(
        foreign_key="tags.id",
        primary_key=True,
        index=True,
        ondelete="CASCADE",
    )


class ListingEditLog(SQLModel, table=True):
    """Append-only record of field-level changes to a listing.

    One update writes several rows sharing a single ``created_at`` so the UI can
    group them into one edit event. Rows are cleared with their listing through the
    FK cascade. Admin-only surface — never exposed to regular users.
    """

    __tablename__ = "listing_edit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    listing_id: uuid.UUID = Field(
        sa_column=Column(
            sa.Uuid,
            sa.ForeignKey("listings.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    # Who made the edit (owner or admin).
    edited_by_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="users.id", nullable=True
    )
    field: str = Field(nullable=False)
    value_from: Optional[str] = Field(default=None, sa_type=String)
    value_to: Optional[str] = Field(default=None, sa_type=String)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        index=True,
    )


class Listing(SQLModel, table=True):
    __tablename__ = "listings"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="users.id", index=True, nullable=False
    )

    category: ListingCategory = Field(index=True)
    status: ListingStatus = Field(default=ListingStatus.ACTIVE, index=True)

    # CONTENT (Translated)
    title_original: str = Field(max_length=150)
    description_original: str = Field(sa_type=String)

    # Translations (Populated by Service/Worker)
    title_en: Optional[str] = None
    title_de: Optional[str] = None
    title_hu: Optional[str] = None
    description_en: Optional[str] = None
    description_de: Optional[str] = None
    description_hu: Optional[str] = None

    # META
    media_urls: List[str] = Field(default=[], sa_column=Column(JSON))

    # LOCATION & VISIBILITY (ZIP-code based system)
    zip_code: Optional[str] = Field(
        default=None,
        sa_column=Column(String(4), nullable=True),
        description="Hungarian 4-digit ZIP code of the listing's origin.",
    )
    d_class: Optional[str] = Field(
        default=None,
        sa_column=Column(String(2), nullable=True, index=True),
        description="Visibility distance class: D1 (0km) to D6 (Online). D5/D6 are nationwide/online.",
    )

    # EXPIRY
    available_until: Optional[datetime] = Field(
        default=None,
        sa_type=DateTime(timezone=True),
        description="Date after which the listing is automatically set to INACTIVE.",
    )

    # Free-text field for payment/price notes (all categories)
    payment_notes: Optional[str] = Field(default=None, sa_type=String)

    # POLYMORPHIC ATTRIBUTES
    attributes: Dict[str, Any] = Field(default={}, sa_column=Column(JSONB))

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )

    # Relationships
    owner: "User" = Relationship(back_populates="listings")
    tags: List[Tag] = Relationship(link_model=ListingTagLink)
