import uuid
from datetime import datetime
from typing import Annotated, Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from app.listings.enums import ListingCategory, ListingStatus

# ==========================================
# ATTRIBUTE MODELS (Category-Specific)
# ==========================================


class ServiceAttributes(BaseModel):
    """Attributes for OFFER_SERVICE listings."""

    time_factor: float = Field(
        ...,
        ge=0.25,
        le=3.0,
        description="Multiplier for time cost. 1.0 = standard rate. Range: 0.25–3.0.",
    )
    location: Optional[str] = Field(
        default=None,
        description="Where the service is offered. Free-text city or address.",
    )


class SearchServiceAttributes(BaseModel):
    """Attributes for SEARCH_SERVICE listings. No payment fields."""

    deadline: Optional[datetime] = Field(
        default=None,
        description="Optional deadline by which the service is needed. ISO 8601 format.",
    )


class ProductAttributes(BaseModel):
    """Attributes for SELL_PRODUCT listings."""

    time_amount: int = Field(
        ...,
        gt=0,
        description="Price in Time currency. Required and must be greater than 0.",
    )
    regio_amount: Optional[int] = Field(
        default=None,
        ge=0,
        description="Price in Regio currency. Optional additional price component.",
    )
    condition: Optional[str] = Field(
        default=None,
        description="Condition of the product: 'new' or 'used'.",
    )
    stock: Optional[int] = Field(
        default=None,
        ge=1,
        description="Number of items available in stock.",
    )


class SearchProductAttributes(BaseModel):
    """Attributes for SEARCH_PRODUCT listings. No payment fields."""

    urgency_deadline: Optional[datetime] = Field(
        default=None,
        description="Optional deadline by which the product is needed. ISO 8601 format.",
    )


class RentalAttributes(BaseModel):
    """Attributes for OFFER_RENTAL listings."""

    handling_fee_time: Optional[int] = Field(
        default=None,
        ge=0,
        description="Handling fee in Time (minutes) for the effort to hand over the item.",
    )
    usage_fee_regio: Optional[int] = Field(
        default=None,
        ge=0,
        description="Usage fee in Regio for wear and tear / depreciation.",
    )
    max_rental_duration: Optional[str] = Field(
        default=None,
        description="Maximum rental duration (e.g. '7 days', '2 weeks').",
    )
    deposit_required: bool = Field(
        default=False,
        description="Whether a deposit is required for this rental.",
    )


class RideShareAttributes(BaseModel):
    """Attributes for RIDE_SHARE listings."""

    from_location: str = Field(
        ...,
        min_length=2,
        description="Starting location (city or address).",
    )
    to_location: str = Field(
        ...,
        min_length=2,
        description="Destination (city or address).",
    )
    price_time: Optional[int] = Field(
        default=None,
        ge=0,
        description="Price in Time currency per seat.",
    )
    price_regio: Optional[int] = Field(
        default=None,
        ge=0,
        description="Price in Regio currency per seat.",
    )
    departure_datetime: Optional[datetime] = Field(
        default=None,
        description="Date and time of departure. ISO 8601 format.",
    )
    seats_available: Optional[int] = Field(
        default=None,
        ge=1,
        description="Number of seats available for passengers.",
    )


class EventAttributes(BaseModel):
    """Attributes for EVENT_WORKSHOP listings."""

    event_start_date: datetime = Field(
        ...,
        description="Start date and time of the event. ISO 8601 format.",
    )
    event_end_date: datetime = Field(
        ...,
        description="End date and time of the event. ISO 8601 format. If same as start date, it is a one-day event.",
    )
    price_time: Optional[int] = Field(
        default=None,
        ge=0,
        description="Participation fee in Time currency.",
    )
    price_regio: Optional[int] = Field(
        default=None,
        ge=0,
        description="Material/expense contribution in Regio currency.",
    )
    location: Optional[str] = Field(
        default=None,
        description="Venue or location of the event. Free-text city or address.",
    )
    max_participants: Optional[int] = Field(
        default=None,
        ge=1,
        description="Maximum number of participants allowed.",
    )


# ==========================================
# TAGS
# ==========================================


class TagCreate(BaseModel):
    name: str = Field(
        ...,
        description="The display name/text of the tag (e.g. 'plumbing', 'vegan').",
    )


class TagPublic(BaseModel):
    id: int = Field(..., description="Unique identifier for the tag.")
    name: str = Field(..., description="The display name/text of the tag.")
    is_official: bool = Field(
        ...,
        description="If True, this tag is system-approved. If False, it is user-generated.",
    )


# ==========================================
# LISTING CREATE (Polymorphic Parent)
# ==========================================


class ListingCreateBase(BaseModel):
    """Common fields shared by all listing types."""

    title: str = Field(
        min_length=5,
        max_length=100,
        description="A concise headline for the listing.",
    )
    description: str = Field(
        min_length=20,
        description="Detailed explanation of the offering or request.",
    )
    payment_notes: Optional[str] = Field(
        default=None,
        description="Free-text field for payment/price details (e.g. 'Material costs depend on brand').",
    )
    media_urls: List[str] = Field(
        default=[],
        description="List of image/PDF URLs associated with the listing.",
    )
    tags: List[str] = Field(
        default=[],
        description="List of tag strings to categorize the listing.",
    )
    radius_km: int = Field(
        default=10,
        description="The radius in kilometers for which this listing is relevant.",
    )
    location_lat: Optional[float] = Field(
        default=None,
        description="Latitude from map selection (e.g. OpenStreetMap). Optional — if provided, enables a precise map pin for viewers.",
    )
    location_lng: Optional[float] = Field(
        default=None,
        description="Longitude from map selection (e.g. OpenStreetMap). Optional — if provided, enables a precise map pin for viewers.",
    )


# Specific Implementations


class CreateServiceListing(ListingCreateBase):
    """Create an Offer Service listing. Uses a time-factor multiplier, no fixed price."""

    category: Literal[ListingCategory.OFFER_SERVICE] = Field(
        ListingCategory.OFFER_SERVICE, description="Category: OFFER_SERVICE"
    )
    attributes: ServiceAttributes = Field(
        ..., description="Service-specific attributes including time factor."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "OFFER_SERVICE",
                "title": "Professional Gardening Help",
                "description": "I can help you with mowing, trimming, and general garden maintenance. Available weekends.",
                "payment_notes": "Fuel costs extra for large gardens.",
                "media_urls": ["https://example.com/garden.jpg"],
                "tags": ["gardening", "outdoor"],
                "radius_km": 15,
                "attributes": {
                    "time_factor": 1.0,
                    "location": "Werne, Germany",
                },
            }
        }
    )


class CreateSearchServiceListing(ListingCreateBase):
    """Create a Search Service listing. A 'wanted' ad — no payment fields, free-text negotiation only."""

    category: Literal[ListingCategory.SEARCH_SERVICE] = Field(
        ListingCategory.SEARCH_SERVICE, description="Category: SEARCH_SERVICE"
    )
    attributes: SearchServiceAttributes = Field(
        default_factory=SearchServiceAttributes,
        description="Optional attributes such as deadline.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "SEARCH_SERVICE",
                "title": "Looking for a plumber",
                "description": "Need someone to fix a leaking pipe in the kitchen. Flexible on timing.",
                "payment_notes": "I can offer max 2 hours.",
                "tags": ["plumbing", "home"],
                "radius_km": 20,
                "attributes": {"deadline": "2026-04-15T00:00:00Z"},
            }
        }
    )


class CreateProductListing(ListingCreateBase):
    """Create a Sell Product listing. Must include a Time price (cannot be Regio-only)."""

    category: Literal[ListingCategory.SELL_PRODUCT] = Field(
        ListingCategory.SELL_PRODUCT, description="Category: SELL_PRODUCT"
    )
    attributes: ProductAttributes = Field(
        ..., description="Pricing and product details."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "SELL_PRODUCT",
                "title": "Homemade Honey Jar (500g)",
                "description": "Pure organic honey from local bees. Glass jar, freshly harvested this season.",
                "payment_notes": "Discount for bulk orders.",
                "media_urls": ["https://example.com/honey.jpg"],
                "tags": ["food", "organic"],
                "radius_km": 50,
                "attributes": {
                    "time_amount": 30,
                    "regio_amount": 5,
                    "condition": "new",
                    "stock": 10,
                },
            }
        }
    )


class CreateSearchProductListing(ListingCreateBase):
    """Create a Search Product listing. A 'wanted' ad — no payment fields, free-text negotiation only."""

    category: Literal[ListingCategory.SEARCH_PRODUCT] = Field(
        ListingCategory.SEARCH_PRODUCT, description="Category: SEARCH_PRODUCT"
    )
    attributes: SearchProductAttributes = Field(
        default_factory=SearchProductAttributes,
        description="Optional attributes such as urgency deadline.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "SEARCH_PRODUCT",
                "title": "Looking for a used bicycle",
                "description": "Need a working bicycle for daily commute. Any brand, must be in good condition.",
                "payment_notes": "Can pay in Time or Regio, flexible.",
                "tags": ["bike", "transport"],
                "radius_km": 30,
                "attributes": {"urgency_deadline": "2026-05-01T00:00:00Z"},
            }
        }
    )


class CreateRentalListing(ListingCreateBase):
    """Create an Offer Rental listing. Handling fee (Time) + usage fee (Regio) for wear & tear."""

    category: Literal[ListingCategory.OFFER_RENTAL] = Field(
        ListingCategory.OFFER_RENTAL, description="Category: OFFER_RENTAL"
    )
    attributes: RentalAttributes = Field(
        ..., description="Rental fee structure and terms."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "OFFER_RENTAL",
                "title": "Drill Hammer for Rent",
                "description": "Powerful drill hammer, includes bit set. Perfect for concrete work.",
                "payment_notes": "Per day rental. Weekend = 2 days.",
                "media_urls": ["https://example.com/drill.jpg"],
                "tags": ["tools", "diy"],
                "radius_km": 10,
                "attributes": {
                    "handling_fee_time": 15,
                    "usage_fee_regio": 5,
                    "max_rental_duration": "7 days",
                    "deposit_required": True,
                },
            }
        }
    )


class CreateRideShareListing(ListingCreateBase):
    """Create a Ride Share listing. Driver gets Time + Regio per seat."""

    category: Literal[ListingCategory.RIDE_SHARE] = Field(
        ListingCategory.RIDE_SHARE, description="Category: RIDE_SHARE"
    )
    attributes: RideShareAttributes = Field(
        ..., description="Route, pricing, and seat details."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "RIDE_SHARE",
                "title": "Ride to Berlin — Friday morning",
                "description": "Driving to Berlin on Friday morning. Non-smoking car, trunk space available.",
                "payment_notes": "Fuel split equally among passengers.",
                "tags": ["travel", "berlin"],
                "radius_km": 5,
                "attributes": {
                    "from_location": "Munich",
                    "to_location": "Berlin",
                    "price_time": 60,
                    "price_regio": 10,
                    "departure_datetime": "2026-04-10T07:00:00Z",
                    "seats_available": 3,
                },
            }
        }
    )


class CreateEventListing(ListingCreateBase):
    """Create an Event/Workshop listing. Participation fee (Time) + material contribution (Regio)."""

    category: Literal[ListingCategory.EVENT_WORKSHOP] = Field(
        ListingCategory.EVENT_WORKSHOP, description="Category: EVENT_WORKSHOP"
    )
    attributes: EventAttributes = Field(
        ..., description="Event schedule, pricing, and capacity."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "EVENT_WORKSHOP",
                "title": "Sourdough Bread Workshop",
                "description": "Learn how to bake your own sourdough bread from scratch. All ingredients provided.",
                "payment_notes": "Materials included in the Regio fee.",
                "media_urls": ["https://example.com/bread.jpg"],
                "tags": ["cooking", "workshop"],
                "radius_km": 30,
                "attributes": {
                    "event_start_date": "2026-04-20T14:00:00Z",
                    "event_end_date": "2026-04-20T18:00:00Z",
                    "price_time": 120,
                    "price_regio": 15,
                    "location": "Community Center, Werne",
                    "max_participants": 12,
                },
            }
        }
    )


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
    Field(
        discriminator="category",
        description="Polymorphic Listing Creation. Select the schema matching your category.",
    ),
]

# ==========================================
# UPDATES & OUTPUTS
# ==========================================


class ListingUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=5,
        max_length=100,
        description="New title for the listing.",
    )
    description: Optional[str] = Field(
        default=None, min_length=20, description="New description text."
    )
    payment_notes: Optional[str] = Field(
        default=None, description="Updated payment/price notes."
    )
    status: Optional[ListingStatus] = Field(
        default=None, description="Update status (e.g. mark as SOLD)."
    )
    media_urls: Optional[List[str]] = Field(
        default=None, description="Replace entire list of media URLs."
    )
    tags: Optional[List[str]] = Field(
        default=None, description="Replace entire list of tags."
    )
    radius_km: Optional[int] = Field(
        default=None, description="Update visibility radius."
    )
    location_lat: Optional[float] = Field(
        default=None,
        description="Updated latitude from map selection.",
    )
    location_lng: Optional[float] = Field(
        default=None,
        description="Updated longitude from map selection.",
    )

    attributes: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Update specific polymorphic attributes based on the listing type.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Gardening Help — Updated",
                "status": "ACTIVE",
                "payment_notes": "Updated pricing details.",
                "radius_km": 20,
                "tags": ["vegan", "plumbing", "tech"],
            }
        }
    )


class ListingPublic(BaseModel):
    id: uuid.UUID = Field(..., description="Unique ID of the listing.")
    owner_code: str = Field(
        ..., description="Code of the user who owns this listing."
    )
    owner_name: str = Field(..., description="Display name of the owner.")
    owner_avatar: Optional[str] = Field(
        default=None, description="URL to the owner's avatar."
    )

    category: ListingCategory = Field(
        ..., description="Category of the listing."
    )
    status: ListingStatus = Field(
        ..., description="Current status (ACTIVE, SOLD, DELETED)."
    )

    title: str = Field(..., description="Localized title of the listing.")
    description: str = Field(
        ..., description="Localized description of the listing."
    )
    payment_notes: Optional[str] = Field(
        default=None, description="Free-text payment/price notes."
    )

    media_urls: List[str] = Field(..., description="List of image URLs.")
    tags: List[str] = Field(..., description="List of associated tags.")
    radius_km: int = Field(..., description="Relevance radius in KM.")
    location_lat: Optional[float] = Field(
        default=None,
        description="Latitude for map pin display. Null if user did not select a map location.",
    )
    location_lng: Optional[float] = Field(
        default=None,
        description="Longitude for map pin display. Null if user did not select a map location.",
    )

    attributes: Dict[str, Any] = Field(
        ..., description="Category-specific attributes payload."
    )

    created_at: datetime = Field(
        ..., description="Timestamp when the listing was created."
    )


class FeedResponse(BaseModel):
    data: List[ListingPublic] = Field(
        ..., description="List of listings for the current page."
    )
    next_cursor: Optional[int] = Field(
        default=None,
        description="Offset to use for fetching the next page. Null if no more data.",
    )
