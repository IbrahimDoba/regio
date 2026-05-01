import uuid
from typing import Any, List, Optional

from fastapi import APIRouter, BackgroundTasks, Query, UploadFile, status

from app.core.file_storage import StorageServiceDep
from app.core.translate import TranslateService
from app.listings.dependencies import ListingServiceDep
from app.listings.enums import ListingCategory, RadiusFilter
from app.listings.schemas import (
    FeedResponse,
    ListingCreate,
    ListingPublic,
    ListingUpdate,
    TagPublic,
)
from app.users.dependencies import CurrentUser

router = APIRouter()


@router.post(
    "/",
    response_model=ListingPublic,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Invalid category data or attributes."
        },
        status.HTTP_401_UNAUTHORIZED: {
            "description": "User is not authenticated."
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def create_listing(
    data: ListingCreate,
    current_user: CurrentUser,
    service: ListingServiceDep,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Create a new listing.

    Validates the 'attributes' field dynamically based on the provided 'category'.
    """
    listing = await service.create_listing(current_user, data)

    if listing:
        background_tasks.add_task(
            TranslateService.translate_listing,
            listing_id=listing.id,
            title=data.title,
            description=data.description,
            origin_language=current_user.language,
        )

    return await service.format_listing(listing, current_user.language)


@router.get(
    "/feed",
    response_model=FeedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        }
    },
)
async def get_feed(
    service: ListingServiceDep,
    categories: Optional[List[ListingCategory]] = Query(
        None, description="Filter by one or more listing categories."
    ),
    q: Optional[str] = Query(
        None, description="Search term for titles and descriptions."
    ),
    tags: Optional[List[str]] = Query(
        None, description="Filter by specific tags."
    ),
    radius: Optional[RadiusFilter] = Query(
        None,
        description="Filter by listing reach. Options: 5km, 10km, 25km, 50km, 100km, nationwide. Omit to show all.",
    ),
    offset: int = Query(
        0, ge=0, description="Pagination offset (skip N items)."
    ),
    lang: str = Query(
        "en", description="Language for localized content (en, de, hu)."
    ),
) -> Any:
    """
    Main Feed.

    Supports filtering by multiple categories, tags, text search, radius, and pagination.
    """
    return await service.get_feed(
        categories=categories,
        search_query=q,
        tags=tags,
        radius_filter=radius,
        offset=offset,
        user_lang=lang,
    )


@router.get(
    "/tags",
    response_model=List[TagPublic],
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        }
    },
)
async def autocomplete_tags(q: str, service: ListingServiceDep) -> Any:
    """
    Search tags for autocomplete.

    Returns a list of tags matching the query string 'q'.
    """
    return await service.search_tags(q)


@router.get(
    "/{listing_id}",
    response_model=ListingPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Listing not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def get_listing_by_id(
    service: ListingServiceDep,
    listing_id: uuid.UUID,
    lang: str = Query(
        "en", description="Language for localized content (en, de, hu)."
    ),
) -> Any:
    """
    Get a listing by its ID.

    Fetches the full details of a listing for display on its standalone page.
    """
    listing = await service.get_listing(listing_id)
    return await service.format_listing(listing, lang)


@router.post(
    "/{listing_id}/media",
    response_model=ListingPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "File type not allowed, size exceeded, or too many files."
        },
        status.HTTP_401_UNAUTHORIZED: {
            "description": "User is not authenticated."
        },
        status.HTTP_403_FORBIDDEN: {
            "description": "User does not own the listing."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Listing not found."},
    },
)
async def upload_listing_media(
    listing_id: uuid.UUID,
    files: List[UploadFile],
    current_user: CurrentUser,
    service: ListingServiceDep,
    storage: StorageServiceDep,
) -> Any:
    """
    Upload media files (images/PDFs) to a listing.

    Accepts multiple files per request. Files are stored in S3 and their keys
    are appended to the listing's media_urls array. Max 10 files per listing,
    10MB per file. Allowed types: JPEG, PNG, WebP, GIF, PDF.
    """
    listing = await service.upload_media(
        listing_id, current_user, files, storage
    )
    return await service.format_listing(listing, current_user.language)


@router.delete(
    "/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Listing not found."},
        status.HTTP_403_FORBIDDEN: {
            "description": "You do not have permission to delete this listing."
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def delete_listing_by_id(
    service: ListingServiceDep,
    listing_id: uuid.UUID,
    current_user: CurrentUser,
) -> None:
    """
    Delete a listing by its ID.

    Only allowed by listing's owner and admins. Action is irreversible.
    """
    await service.delete_listing(listing_id, current_user)
    # 204 requires no return body


@router.patch(
    "/{listing_id}",
    response_model=ListingPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Validation error in update data."
        },
        status.HTTP_401_UNAUTHORIZED: {
            "description": "User is not authenticated."
        },
        status.HTTP_403_FORBIDDEN: {
            "description": "User does not own the listing."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Listing not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def update_listing(
    listing_id: uuid.UUID,
    update_data: ListingUpdate,
    current_user: CurrentUser,
    service: ListingServiceDep,
    storage: StorageServiceDep,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Edit an existing listing.

    Accepts partial updates. Only the owner can perform this action.
    If media_urls is updated, any removed URLs will have their S3 objects deleted.
    """
    listing = await service.update_listing(
        listing_id, current_user, update_data, storage=storage
    )

    # Re-translate only if title or description changed
    if update_data.title is not None or update_data.description is not None:
        background_tasks.add_task(
            TranslateService.translate_listing,
            listing_id=listing.id,
            title=listing.title_original,
            description=listing.description_original,
            origin_language=current_user.language,
        )

    return await service.format_listing(listing, current_user.language)
