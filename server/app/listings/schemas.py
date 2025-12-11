import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal, Union, Annotated
from pydantic import BaseModel, Field, model_validator, ConfigDict

from app.listings.enums import ListingCategory, ListingStatus

# ==========================================
# ATTRIBUTE MODELS (The Specifics)
# ==========================================


class ServiceAttributes(BaseModel):
    time_factor: float = Field(
        ...,
        ge=0.25,
        le=3.0,
        description="Multiplier for time cost. Must be between 0.25 and 3.0. A factor of 1.0 means standard rate.",
    )


class ProductAttributes(BaseModel):
    regio_amount: Optional[int] = Field(None, description="Price in Regio currency.")
    time_amount: Optional[int] = Field(None, description="Price in Time currency.")

    @model_validator(mode="after")
    def check_price_exists(self) -> "ProductAttributes":
        if self.regio_amount is None and self.time_amount is None:
            raise ValueError(
                "Product must have a price (either regio_amount or time_amount)"
            )
        return self


class RentalAttributes(BaseModel):
    fee_regio: Optional[int] = Field(
        None, description="Rental fee in Regio per unit of time."
    )
    fee_time: Optional[int] = Field(
        None, description="Rental fee in Time per unit of time."
    )

    @model_validator(mode="after")
    def check_fee_exists(self) -> "RentalAttributes":
        if self.fee_regio is None and self.fee_time is None:
            raise ValueError("Rental must have a fee (either fee_regio or fee_time)")
        return self


class RideShareAttributes(BaseModel):
    start: str = Field(
        ..., min_length=2, description="Starting location (City or Address)."
    )
    destination: str = Field(
        ..., min_length=2, description="Destination (City or Address)."
    )


class EventAttributes(BaseModel):
    event_start_date: datetime = Field(
        ..., description="ISO 8601 format start date and time of the event."
    )
    event_end_date: datetime = Field(
        ..., description="ISO 8601 format end date and time of the event."
    )


# ==========================================
# TAGS
# ==========================================


class TagCreate(BaseModel):
    name: str = Field(
        ..., description="The display name/text of the tag (e.g. 'plumbing', 'vegan')."
    )


class TagPublic(BaseModel):
    id: uuid.UUID = Field(..., description="Unique identifier for the tag.")
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
        min_length=5, max_length=100, description="A concise headline for the listing."
    )
    description: str = Field(
        min_length=20, description="Detailed explanation of the offering or request."
    )

    media_urls: List[str] = Field(
        default=[], description="List of image/PDF URLs associated with the listing."
    )
    tags: List[str] = Field(
        default=[], description="List of tag strings to categorize the listing."
    )
    radius_km: int = Field(
        default=10,
        description="The radius in kilometers for which this listing is relevant.",
    )


# Specific Implementations with Examples


class CreateServiceListing(ListingCreateBase):
    category: Literal[ListingCategory.OFFER_SERVICE] = Field(
        ListingCategory.OFFER_SERVICE, description="Category: OFFER_SERVICE"
    )
    attributes: ServiceAttributes = Field(..., description="Time factor settings.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "OFFER_SERVICE",
                "title": "Professional Gardening Help",
                "description": "I can help you with mowing, trimming, and general garden maintenance. Available weekends.",
                "media_urls": ["https://example.com/garden.jpg"],
                "tags": ["gardening", "outdoor"],
                "radius_km": 15,
                "attributes": {"time_factor": 1.0},
            }
        }
    )


class CreateProductListing(ListingCreateBase):
    category: Literal[ListingCategory.SELL_PRODUCT] = Field(
        ListingCategory.SELL_PRODUCT, description="Category: SELL_PRODUCT"
    )
    attributes: ProductAttributes = Field(
        ..., description="Pricing information (Regio or Time)."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "SELL_PRODUCT",
                "title": "Vintage Bicycle",
                "description": "Fully restored 1980s road bike. New tires and brakes.",
                "media_urls": ["https://example.com/bike.jpg"],
                "tags": ["bike", "vintage"],
                "radius_km": 50,
                "attributes": {"regio_amount": 150, "time_amount": 0},
            }
        }
    )


class CreateRentalListing(ListingCreateBase):
    category: Literal[ListingCategory.OFFER_RENTAL] = Field(
        ListingCategory.OFFER_RENTAL, description="Category: OFFER_RENTAL"
    )
    attributes: RentalAttributes = Field(..., description="Rental fee structure.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "OFFER_RENTAL",
                "title": "Drill Hammer for Rent",
                "description": "Powerful drill hammer, includes bit set. Perfect for concrete.",
                "media_urls": ["https://example.com/drill.jpg"],
                "tags": ["tools", "diy"],
                "radius_km": 10,
                "attributes": {"fee_time": 60},
            }
        }
    )


class CreateRideShareListing(ListingCreateBase):
    category: Literal[ListingCategory.RIDE_SHARE] = Field(
        ListingCategory.RIDE_SHARE, description="Category: RIDE_SHARE"
    )
    attributes: RideShareAttributes = Field(..., description="Route details.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "RIDE_SHARE",
                "title": "Ride to Berlin",
                "description": "Driving to Berlin on Friday morning. 3 seats available. Non-smoking car.",
                "media_urls": [],
                "tags": ["travel", "berlin"],
                "radius_km": 5,
                "attributes": {"start": "Munich", "destination": "Berlin"},
            }
        }
    )


class CreateEventListing(ListingCreateBase):
    category: Literal[ListingCategory.EVENT_WORKSHOP] = Field(
        ListingCategory.EVENT_WORKSHOP, description="Category: EVENT_WORKSHOP"
    )
    attributes: EventAttributes = Field(..., description="Event time period.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "EVENT_WORKSHOP",
                "title": "Sourdough Bread Workshop",
                "description": "Learn how to bake your own sourdough bread from scratch. Ingredients provided.",
                "media_urls": ["https://example.com/bread.jpg"],
                "tags": ["cooking", "workshop"],
                "radius_km": 30,
                "attributes": {
                    "event_start_date": "2023-12-25T14:00:00Z",
                    "event_end_date": "2024-01-01T14:00:00Z",
                },
            }
        }
    )


# LISTING UNION
ListingCreate = Annotated[
    Union[
        CreateServiceListing,
        CreateProductListing,
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

    attributes: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Update specific polymorphic attributes based on the listing type.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Gardening Help - Updated",
                "status": "ACTIVE",
                "radius_km": 20,
                "tags": ["vegan", "plumbing", "tech"],
            }
        }
    )


class ListingPublic(BaseModel):
    id: uuid.UUID = Field(..., description="Unique ID of the listing.")
    owner_code: str = Field(..., description="Code of the user who owns this listing.")
    owner_name: str = Field(..., description="Display name of the owner.")
    owner_avatar: Optional[str] = Field(
        default=None, description="URL to the owner's avatar."
    )

    category: ListingCategory = Field(..., description="Category of the listing.")
    status: ListingStatus = Field(
        ..., description="Current status (ACTIVE, SOLD, DELETED)."
    )

    # We return the localized version based on user pref
    title: str = Field(..., description="Localized title of the listing.")
    description: str = Field(..., description="Localized description of the listing.")

    media_urls: List[str] = Field(..., description="List of image URLs.")
    tags: List[str] = Field(..., description="List of associated tags.")
    radius_km: int = Field(..., description="Relevance radius in KM.")

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
