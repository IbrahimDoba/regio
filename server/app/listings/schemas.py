import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator

from app.listings.enums import DClass, ListingCategory, ListingStatus

# ==========================================
# ATTRIBUTE MODELS (Category-Specific)
# ==========================================


class ServiceAttributes(BaseModel):
    time_factor: float = Field(..., ge=0.25, le=3.0)
    location: Optional[str] = Field(default=None)


class SearchServiceAttributes(BaseModel):
    deadline: Optional[datetime] = Field(default=None)


class ProductAttributes(BaseModel):
    time_amount: Optional[int] = Field(default=None, gt=0)
    regio_amount: Optional[int] = Field(default=None, ge=0)
    condition: Optional[str] = Field(default=None)
    stock: Optional[int] = Field(default=None, ge=1)


class SearchProductAttributes(BaseModel):
    urgency_deadline: Optional[datetime] = Field(default=None)


class RentalAttributes(BaseModel):
    handling_fee_time: Optional[int] = Field(default=None, ge=0)
    usage_fee_regio: Optional[int] = Field(default=None, ge=0)
    max_rental_duration: Optional[str] = Field(default=None)
    deposit_required: bool = Field(default=False)


class RideShareAttributes(BaseModel):
    from_location: str = Field(..., min_length=2)
    to_location: str = Field(..., min_length=2)
    price_time: Optional[int] = Field(default=None, ge=0)
    price_regio: Optional[int] = Field(default=None, ge=0)
    departure_datetime: Optional[datetime] = Field(default=None)
    seats_available: Optional[int] = Field(default=None, ge=1)


class EventAttributes(BaseModel):
    event_start_date: datetime = Field(...)
    event_end_date: datetime = Field(...)
    price_time: Optional[int] = Field(default=None, ge=0)
    price_regio: Optional[int] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None)
    max_participants: Optional[int] = Field(default=None, ge=1)


# ==========================================
# TAGS
# ==========================================


class TagCreate(BaseModel):
    name: str


class TagPublic(BaseModel):
    id: int
    name: (
        str  # canonical (English) — submitted when creating/filtering listings
    )
    label: str  # localized display name — shown in the UI
    is_official: bool


# ==========================================
# LISTING CREATE (Polymorphic Parent)
# ==========================================

_TWO_MONTHS = timedelta(days=62)


class ListingCreateBase(BaseModel):
    """Common fields shared by all listing types."""

    title: str = Field(min_length=5, max_length=100)
    description: str = Field(min_length=20)
    payment_notes: Optional[str] = Field(default=None)
    media_urls: List[str] = Field(default=[])
    tags: List[str] = Field(default=[])

    # ZIP-code based visibility (replaces the old radius_km / lat / lng system)
    zip_code: Optional[str] = Field(
        default=None,
        min_length=4,
        max_length=4,
        pattern=r"^\d{4}$",
        description="Hungarian 4-digit ZIP code. Pre-filled from user profile, overridable.",
    )
    d_class: DClass = Field(
        default=DClass.D5,
        description="Visibility distance class D1–D6.",
    )

    # Expiry
    available_until: Optional[datetime] = Field(
        default=None,
        description="Date when listing auto-expires (INACTIVE). Max 2 months ahead.",
    )

    @field_validator("available_until", mode="before")
    @classmethod
    def validate_available_until(cls, v: Any) -> Any:
        if v is None:
            return v
        if isinstance(v, str):
            v = datetime.fromisoformat(v.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= now:
            raise ValueError("available_until must be in the future")
        if v > now + _TWO_MONTHS:
            raise ValueError(
                "available_until cannot be more than 2 months ahead"
            )
        return v


class CreateServiceListing(ListingCreateBase):
    category: Literal[ListingCategory.OFFER_SERVICE] = Field(
        ListingCategory.OFFER_SERVICE
    )
    attributes: ServiceAttributes


class CreateSearchServiceListing(ListingCreateBase):
    category: Literal[ListingCategory.SEARCH_SERVICE] = Field(
        ListingCategory.SEARCH_SERVICE
    )
    attributes: SearchServiceAttributes = Field(
        default_factory=SearchServiceAttributes
    )


class CreateProductListing(ListingCreateBase):
    category: Literal[ListingCategory.SELL_PRODUCT] = Field(
        ListingCategory.SELL_PRODUCT
    )
    attributes: ProductAttributes


class CreateSearchProductListing(ListingCreateBase):
    category: Literal[ListingCategory.SEARCH_PRODUCT] = Field(
        ListingCategory.SEARCH_PRODUCT
    )
    attributes: SearchProductAttributes = Field(
        default_factory=SearchProductAttributes
    )


class CreateRentalListing(ListingCreateBase):
    category: Literal[ListingCategory.OFFER_RENTAL] = Field(
        ListingCategory.OFFER_RENTAL
    )
    attributes: RentalAttributes


class CreateRideShareListing(ListingCreateBase):
    category: Literal[ListingCategory.RIDE_SHARE] = Field(
        ListingCategory.RIDE_SHARE
    )
    attributes: RideShareAttributes


class CreateEventListing(ListingCreateBase):
    category: Literal[ListingCategory.EVENT_WORKSHOP] = Field(
        ListingCategory.EVENT_WORKSHOP
    )
    attributes: EventAttributes


# LISTING UNION
ListingCreate = Annotated[
    Union[
        CreateServiceListing,
        CreateSearchServiceListing,
        CreateProductListing,
        CreateSearchProductListing,
        CreateRentalListing,
        CreateRideShareListing,
        CreateEventListing,
    ],
    Field(discriminator="category"),
]

# ==========================================
# UPDATES & OUTPUTS
# ==========================================


class ListingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=5, max_length=100)
    description: Optional[str] = Field(default=None, min_length=20)
    payment_notes: Optional[str] = Field(default=None)
    status: Optional[ListingStatus] = Field(default=None)
    media_urls: Optional[List[str]] = Field(default=None)
    tags: Optional[List[str]] = Field(default=None)

    zip_code: Optional[str] = Field(
        default=None, min_length=4, max_length=4, pattern=r"^\d{4}$"
    )
    d_class: Optional[DClass] = Field(default=None)

    available_until: Optional[datetime] = Field(default=None)

    attributes: Optional[Dict[str, Any]] = Field(default=None)

    @field_validator("available_until", mode="before")
    @classmethod
    def validate_available_until(cls, v: Any) -> Any:
        if v is None:
            return v
        if isinstance(v, str):
            v = datetime.fromisoformat(v.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= now:
            raise ValueError("available_until must be in the future")
        if v > now + _TWO_MONTHS:
            raise ValueError(
                "available_until cannot be more than 2 months ahead"
            )
        return v


class ListingPublic(BaseModel):
    id: uuid.UUID
    owner_code: str
    owner_name: str
    owner_avatar: Optional[str] = None

    category: ListingCategory
    status: ListingStatus

    title: str
    description: str
    payment_notes: Optional[str] = None

    media_urls: List[str]
    tags: List[str]  # localized display labels
    # canonical names, parallel to `tags` — submit these back on update
    tags_canonical: List[str] = []

    zip_code: Optional[str] = None
    d_class: Optional[str] = None
    owner_zip_code: Optional[str] = None
    owner_city: Optional[str] = None
    distance_km: Optional[int] = None
    available_until: Optional[datetime] = None

    attributes: Dict[str, Any]
    created_at: datetime


class FeedResponse(BaseModel):
    data: List[ListingPublic]
    next_cursor: Optional[int] = None


class ListingEditLogEntry(BaseModel):
    """A single field-level change in a listing's history (admin-only surface)."""

    field: str
    value_from: Optional[str] = None
    value_to: Optional[str] = None
    created_at: datetime
    edited_by: Optional[str] = None  # editor's full name, if still resolvable
