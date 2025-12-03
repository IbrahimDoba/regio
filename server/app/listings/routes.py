import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, status, Response

from app.listings.schemas import ListingCreate, ListingPublic, FeedResponse, TagPublic, ListingUpdate
from app.listings.dependencies import ListingServiceDep
from app.listings.enums import ListingCategory
from app.listings.exceptions import ListingNotFound, ListingNotOwned
from app.users.dependencies import CurrentUser

router = APIRouter()

@router.post("/", response_model=ListingPublic)
async def create_listing(
    data: ListingCreate,
    current_user: CurrentUser,
    service: ListingServiceDep
) -> Any:
    """
    Create a new listing. 
    'attributes' field validates based on 'category'.
    """
    try:
        # We assume service returns the ORM object, we might need to map it manually 
        # to ListingPublic to handle the "owner_name" logic, or let Pydantic try.
        # For safety, let's create the response dict manually or update Service to return schema.
        # Here we rely on the service saving it and we refetch or construct response.
        
        listing = await service.create_listing(current_user, data)

        return listing
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    
@router.get("/{listing_id}", response_model=ListingPublic)
async def get_listing_by_id(
    service: ListingServiceDep, 
    listing_id: uuid.UUID
) -> Any:
    """
    Get a listing by it's ID for display on it's standalone page.
    """

    try:
        # Get listing ORM object
        listing = await service.get_listing(listing_id)

        return listing
    except ListingNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    
@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing_by_id(
    service: ListingServiceDep, 
    listing_id: uuid.UUID,
    current_user: CurrentUser
) -> None:
    """
    Delete a listing by its ID. Only allowed by listing's owner and admins.
    """

    try:
        await service.delete_listing(listing_id, current_user)
        # No return statement needed for 204 No Content
    except ListingNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Listing not found"
        )
    except ListingNotOwned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You do not have permission to delete this listing"
        )

@router.patch("/{listing_id}", response_model=ListingPublic)
async def update_listing(
    listing_id: uuid.UUID,
    update_data: ListingUpdate,
    current_user: CurrentUser,
    service: ListingServiceDep
) -> Any:
    """
    Edit an existing listing.
    """
    try:
        return await service.update_listing(listing_id, current_user, update_data)
    except ListingNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    except ListingNotOwned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this listing")

@router.get("/feed", response_model=List[ListingPublic])
async def get_feed(
    service: ListingServiceDep,
    categories: Optional[List[ListingCategory]] = Query(None),
    q: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    offset: int = 0
) -> Any:
    """
    Main Feed. Supports filtering by multiple categories, tags, and text search.
    """
    return await service.get_feed(
        categories=categories,
        search_query=q,
        tags=tags,
        offset=offset
    )

@router.get("/tags", response_model=List[TagPublic])
async def autocomplete_tags(
    q: str,
    service: ListingServiceDep
) -> Any:
    """
    Search tags for autocomplete.
    """
    return await service.search_tags(q)
