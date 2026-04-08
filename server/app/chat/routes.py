import logging

from fastapi import APIRouter, HTTPException, status

from app.chat.matrix_service import (
    ensure_matrix_user,
    get_or_create_inquiry_room,
    get_user_rooms,
)
from app.chat.schemas import (
    InquiryRoomResponse,
    ListingInquiryRequest,
    MatrixTokenResponse,
    RoomsListResponse,
    RoomSummary,
)
from app.core.config import settings
from app.core.database import SessionDep
from app.users.dependencies import CurrentUser, UserServiceDep

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/matrix/register",
    status_code=status.HTTP_200_OK,
    summary="Lazy-register Matrix account for current user",
)
async def matrix_register(current_user: CurrentUser, db: SessionDep):
    """
    Called when a user opens the chat for the first time.
    Provisions a Matrix account if one doesn't exist yet.
    """
    matrix_user_id, access_token = await ensure_matrix_user(
        current_user.id, db
    )
    return MatrixTokenResponse(
        matrix_user_id=matrix_user_id,
        matrix_access_token=access_token,
        matrix_homeserver=settings.MATRIX_HOMESERVER,
    )


@router.post(
    "/matrix/token",
    response_model=MatrixTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Matrix access token for current user",
)
async def get_matrix_token(current_user: CurrentUser, db: SessionDep):
    """
    Returns the Matrix access token (and user id / homeserver) for the
    currently authenticated platform user.  Provisions a Matrix account
    lazily if needed.
    """
    matrix_user_id, access_token = await ensure_matrix_user(
        current_user.id, db
    )
    return MatrixTokenResponse(
        matrix_user_id=matrix_user_id,
        matrix_access_token=access_token,
        matrix_homeserver=settings.MATRIX_HOMESERVER,
    )


@router.post(
    "/rooms/inquiry",
    response_model=InquiryRoomResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or get inquiry room for a listing",
)
async def inquire_listing(
    data: ListingInquiryRequest,
    current_user: CurrentUser,
    user_service: UserServiceDep,
    db: SessionDep,
):
    """
    Create (or retrieve) a Matrix room for a listing inquiry between buyer
    and seller.  Returns the Matrix room ID so the frontend SDK can join.
    """
    seller = await user_service.get_user_by_code(data.seller_user_code)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Seller not found"
        )
    if seller.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot inquire about your own listing.",
        )

    matrix_room_id = await get_or_create_inquiry_room(
        listing_id=data.listing_id,
        buyer_id=current_user.id,
        seller_id=seller.id,
        listing_title=data.listing_title,
        db=db,
    )
    return InquiryRoomResponse(matrix_room_id=matrix_room_id)


@router.get(
    "/rooms",
    response_model=RoomsListResponse,
    status_code=status.HTTP_200_OK,
    summary="List user's Matrix chat rooms",
)
async def get_my_rooms(current_user: CurrentUser, db: SessionDep):
    """Return all Matrix rooms the current user participates in."""
    rooms_data = await get_user_rooms(current_user.id, db)
    rooms = [RoomSummary(**r) for r in rooms_data]
    return RoomsListResponse(rooms=rooms)
