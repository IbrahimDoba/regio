import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Query, status

from app.listings.schemas import ListingCreate, ListingPublic, FeedResponse, TagPublic, ListingUpdate
from app.listings.dependencies import ListingServiceDep
from app.listings.enums import ListingCategory
from app.users.dependencies import CurrentUser

router = APIRouter()

@router.post("/", response_model=ListingPublic, status_code=status.HTTP_201_CREATED, responses={
    status.HTTP_400_BAD_REQUEST: {"description": "Invalid category data or attributes."},
    status.HTTP_401_UNAUTHORIZED: {"description": "User is not authenticated."},
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
})
async def create_listing(
    data: ListingCreate,
    current_user: CurrentUser,
    service: ListingServiceDep
) -> Any:
    """
    Create a new listing.
    
    Validates the 'attributes' field dynamically based on the provided 'category'.
    """
    listing = await service.create_listing(current_user, data)
    return await service.format_listing(listing)

    
@router.get("/feed", response_model=FeedResponse, status_code=status.HTTP_200_OK, responses={
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
})
async def get_feed(
    service: ListingServiceDep,
    categories: Optional[List[ListingCategory]] = Query(None, description="Filter by one or more listing categories."),
    q: Optional[str] = Query(None, description="Search term for titles and descriptions."),
    tags: Optional[List[str]] = Query(None, description="Filter by specific tags."),
    offset: int = Query(0, ge=0, description="Pagination offset (skip N items).")
) -> Any:
    """
    Main Feed. 
    
    Supports filtering by multiple categories, tags, text search, and pagination.
    """
    return await service.get_feed(
        categories=categories,
        search_query=q,
        tags=tags,
        offset=offset
    )

@router.get("/tags", response_model=List[TagPublic], status_code=status.HTTP_200_OK, responses={
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
})
async def autocomplete_tags(
    q: str,
    service: ListingServiceDep
) -> Any:
    """
    Search tags for autocomplete.
    
    Returns a list of tags matching the query string 'q'.
    """
    return await service.search_tags(q)
    
@router.get("/{listing_id}", response_model=ListingPublic, status_code=status.HTTP_200_OK, responses={
    status.HTTP_404_NOT_FOUND: {"description": "Listing not found."},
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
})
async def get_listing_by_id(
    service: ListingServiceDep, 
    listing_id: uuid.UUID
) -> Any:
    """
    Get a listing by its ID.
    
    Fetches the full details of a listing for display on its standalone page.
    """
    listing = await service.get_listing(listing_id)
    return await service.format_listing(listing)

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT, responses={
    status.HTTP_404_NOT_FOUND: {"description": "Listing not found."},
    status.HTTP_403_FORBIDDEN: {"description": "You do not have permission to delete this listing."},
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."},
})
async def delete_listing_by_id(
    service: ListingServiceDep, 
    listing_id: uuid.UUID,
    current_user: CurrentUser
) -> None:
    """
    Delete a listing by its ID. 
    
    Only allowed by listing's owner and admins. Action is irreversible.
    """
    await service.delete_listing(listing_id, current_user)
    # 204 requires no return body

@router.patch("/{listing_id}", response_model=ListingPublic, status_code=status.HTTP_200_OK, responses={
    status.HTTP_400_BAD_REQUEST: {"description": "Validation error in update data."},
    status.HTTP_401_UNAUTHORIZED: {"description": "User is not authenticated."},
    status.HTTP_403_FORBIDDEN: {"description": "User does not own the listing."},
    status.HTTP_404_NOT_FOUND: {"description": "Listing not found."},
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
})
async def update_listing(
    listing_id: uuid.UUID,
    update_data: ListingUpdate,
    current_user: CurrentUser,
    service: ListingServiceDep
) -> Any:
    """
    Edit an existing listing.
    
    Accepts partial updates. Only the owner can perform this action.
    """
    listing = await service.update_listing(listing_id, current_user, update_data)
    return await service.format_listing(listing)
