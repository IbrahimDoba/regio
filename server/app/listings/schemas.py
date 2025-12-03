import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, model_validator

from app.listings.enums import ListingCategory, ListingStatus

# TAGS
class TagCreate(BaseModel):
    name: str
    
class TagPublic(BaseModel):
    id: uuid.UUID
    name: str
    is_official: bool

# LISTING INPUT
class ListingCreate(BaseModel):
    category: ListingCategory
    title: str = Field(min_length=5, max_length=100)
    description: str = Field(min_length=20)
    
    media_urls: List[str] = []
    tags: List[str] = []
    radius_km: int = 10
    
    # Polymorphic Data Bag
    # Frontend sends all category-specific fields here
    attributes: Dict[str, Any]

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
    title: Optional[str] = Field(default=None, min_length=5, max_length=100)
    description: Optional[str] = Field(default=None, min_length=20)
    status: Optional[ListingStatus] = None
    media_urls: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    radius_km: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None

# LISTING OUTPUT
class ListingPublic(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    owner_name: str # Enriched in Service
    owner_avatar: Optional[str] = None # Enriched
    
    category: ListingCategory
    status: ListingStatus
    
    # We return the localized version based on user pref
    title: str 
    description: str
    
    media_urls: List[str]
    tags: List[str]
    radius_km: int
    attributes: Dict[str, Any]
    
    created_at: datetime

class FeedResponse(BaseModel):
    data: List[ListingPublic]
    next_cursor: Optional[int] = None # For infinite scroll
