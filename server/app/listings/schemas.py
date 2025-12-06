import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, model_validator, ConfigDict

from app.listings.enums import ListingCategory, ListingStatus

# TAGS
class TagCreate(BaseModel):
    name: str = Field(..., description="The display name/text of the tag (e.g. 'plumbing', 'vegan').")
    
class TagPublic(BaseModel):
    id: uuid.UUID = Field(..., description="Unique identifier for the tag.")
    name: str = Field(..., description="The display name/text of the tag.")
    is_official: bool = Field(..., description="If True, this tag is system-approved. If False, it is user-generated.")

# LISTING INPUT
class ListingCreate(BaseModel):
    category: ListingCategory = Field(..., description="The type of listing. Determines required fields in 'attributes'.")
    title: str = Field(min_length=5, max_length=100, description="A concise headline for the listing.")
    description: str = Field(min_length=20, description="Detailed explanation of the offering or request.")
    
    media_urls: List[str] = Field(default=[], description="List of image/PDF URLs associated with the listing.")
    tags: List[str] = Field(default=[], description="List of tag strings to categorize the listing.")
    radius_km: int = Field(default=10, description="The radius in kilometers for which this listing is relevant.")
    
    # Polymorphic Data Bag
    # Frontend sends all category-specific fields here
    attributes: Dict[str, Any] = Field(
        ..., 
        description="Category-specific attributes. E.g., 'time_factor' for services, 'price' for products."
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "category": "OFFER_SERVICE",
                "title": "Professional Gardening Help",
                "description": "I can help you with mowing, trimming, and general garden maintenance. Available weekends.",
                "media_urls": ["https://example.com/garden.jpg"],
                "tags": ["gardening", "outdoor", "help"],
                "radius_km": 15,
                "attributes": {
                    "time_factor": 1.0
                }
            }
        }
    )

    @model_validator(mode='after')
    def validate_attributes_by_category(self) -> 'ListingCreate':
        cat = self.category
        attrs = self.attributes
        
        # OFFER SERVICE (Time Factor)
        if cat == ListingCategory.OFFER_SERVICE:
            if "time_factor" not in attrs:
                raise ValueError("Offer Service requires 'time_factor'")
            factor = float(attrs["time_factor"])
            if not (0.25 <= factor <= 3.0):
                raise ValueError("Time Factor must be between 0.25 and 3.0")

        # SELL PRODUCT (Regio/Time Amount)
        elif cat == ListingCategory.SELL_PRODUCT:
            if "regio_amount" not in attrs and "time_amount" not in attrs:
                raise ValueError("Product must have a price (Regio or Time)")

        # RENTAL
        elif cat == ListingCategory.OFFER_RENTAL:
            if "fee_time" not in attrs and "fee_regio" not in attrs:
                raise ValueError("Rental must have a fee")
                
        # RIDE SHARE
        elif cat == ListingCategory.RIDE_SHARE:
            if "start" not in attrs or "destination" not in attrs:
                raise ValueError("Ride Share requires Start and Destination")
                
        # EVENT
        elif cat == ListingCategory.EVENT_WORKSHOP:
            if "event_date" not in attrs:
                raise ValueError("Event requires a date")

        return self
    
class ListingUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=5, max_length=100, description="New title for the listing.")
    description: Optional[str] = Field(default=None, min_length=20, description="New description text.")
    status: Optional[ListingStatus] = Field(default=None, description="Update status (e.g. mark as SOLD).")
    media_urls: Optional[List[str]] = Field(default=None, description="Replace entire list of media URLs.")
    tags: Optional[List[str]] = Field(default=None, description="Replace entire list of tags.")
    radius_km: Optional[int] = Field(default=None, description="Update visibility radius.")
    attributes: Optional[Dict[str, Any]] = Field(default=None, description="Update specific polymorphic attributes based on the listing type.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Gardening Help - Updated",
                "status": "ACTIVE",
                "radius_km": 20,
                "tags": ["vegan", "plumbing", "tech"]
            }
        }
    )

# LISTING OUTPUT
class ListingPublic(BaseModel):
    id: uuid.UUID = Field(..., description="Unique ID of the listing.")
    # owner_id: uuid.UUID = Field(..., description="UUID of the user who owns this listing.")
    owner_code: str = Field(..., description="Code of the user who owns this listing.")
    owner_name: str = Field(..., description="Display name of the owner.")
    owner_avatar: Optional[str] = Field(default=None, description="URL to the owner's avatar.")
    
    category: ListingCategory = Field(..., description="Category of the listing.")
    status: ListingStatus = Field(..., description="Current status (ACTIVE, SOLD, DELETED).")
    
    # We return the localized version based on user pref
    title: str = Field(..., description="Localized title of the listing.")
    description: str = Field(..., description="Localized description of the listing.")
    
    media_urls: List[str] = Field(..., description="List of image URLs.")
    tags: List[str] = Field(..., description="List of associated tags.")
    radius_km: int = Field(..., description="Relevance radius in KM.")
    attributes: Dict[str, Any] = Field(..., description="Category-specific attributes payload.")
    
    created_at: datetime = Field(..., description="Timestamp when the listing was created.")

class FeedResponse(BaseModel):
    data: List[ListingPublic] = Field(..., description="List of listings for the current page.")
    next_cursor: Optional[int] = Field(default=None, description="Offset to use for fetching the next page. Null if no more data.")
