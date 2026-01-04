from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.chat.dependencies import ChatServiceDep
from app.chat.schemas import (
    JoinedRoomsResponse,
    ListingInquiryRequest,
    MatrixTokenResponse,
    RoomCreateRequest,
    RoomResponse,
)
from app.users.dependencies import CurrentUser, UserServiceDep

router = APIRouter()


@router.get(
    "/token",
    response_model=MatrixTokenResponse,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_502_BAD_GATEWAY: {
            "description": "Failed to communicate with Matrix Homeserver."
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def get_matrix_session(current_user: CurrentUser, service: ChatServiceDep) -> Any:
    """
    Get Matrix Access Token (Handshake).

    The frontend calls this to authenticate with the Matrix Homeserver.
    If the user does not have a Matrix account yet, one is JIT-provisioned.
    """
    try:
        data = await service.get_user_access_token(current_user)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Matrix Handshake Failed: {str(e)}",
        )


@router.get(
    "/rooms",
    response_model=JoinedRoomsResponse,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_502_BAD_GATEWAY: {
            "description": "Failed to fetch data from Matrix."
        }
    },
)
async def get_my_rooms(current_user: CurrentUser, service: ChatServiceDep) -> Any:
    """
    Get joined rooms.

    Returns a list of all Matrix Room IDs that the current user is a member of.
    """
    try:
        rooms = await service.get_joined_rooms(current_user)
        return JoinedRoomsResponse(joined_rooms=rooms)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch joined rooms: {str(e)}",
        )


@router.post(
    "/rooms/inquiry",
    response_model=RoomResponse,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Cannot inquire about own listing."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Seller not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Failed to create/join room."
        },
    },
)
async def inquire_listing(
    data: ListingInquiryRequest,
    current_user: CurrentUser,
    user_service: UserServiceDep,
    chat_service: ChatServiceDep,
) -> RoomResponse:
    """
    Start an inquiry (Contextual Chat).

    Triggered when a user clicks 'Inquire' on a Listing.
    - If a chat for this specific listing + buyer pair exists, returns that room.
    - If not, creates a new private, encrypted room with the seller.
    """

    # Validate Seller Exists
    seller = await user_service.get_user_by_code(data.seller_user_code)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found",
        )

    # Prevent Self-Inquiry
    if seller.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot inquire about your own listing.",
        )

    try:
        # Join or Create Contextual Room
        result = await chat_service.join_or_create_listing_room(
            buyer=current_user,
            seller=seller,
            listing_id=data.listing_id,
            listing_title=data.listing_title,
        )
        return result

    except HTTPException as he:
        raise he
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to establish inquiry chat room.",
        )


@router.post(
    "/rooms",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "One or more invitees not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Failed to create room."
        },
    },
)
async def create_generic_room(
    data: RoomCreateRequest,
    current_user: CurrentUser,
    user_service: UserServiceDep,
    chat_service: ChatServiceDep,
) -> Any:
    """
    Create a generic ad-hoc room.

    Used for creating standard chats outside of the listing context.
    - **invite_user_codes**: List of users to invite.
    - **is_direct**: If true, marks as DM.
    """
    invitees = []
    for code in data.invite_user_codes:
        user = await user_service.get_user_by_code(code)
        if user:
            invitees.append(user)

    if not invitees:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No valid users found to invite",
        )

    try:
        room_id = await chat_service.create_room(
            creator=current_user, invitees=invitees, name=data.name, topic=data.topic
        )
        return RoomResponse(room_id=room_id)
    except Exception as e:
        print(f"Room Creation Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat room",
        )
