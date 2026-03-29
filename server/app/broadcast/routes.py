from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.broadcast.dependencies import BroadcastServiceDep
from app.broadcast.schemas import (
    BroadcastCreateRequest,
    BroadcastStatsResponse,
    InboxItemResponse,
)
from app.users.dependencies import CurrentUser, get_current_active_system_admin

router = APIRouter()


@router.post(
    "/send",
    response_model=BroadcastStatsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send a broadcast (Admins Only)",
    operation_id="send_broadcast",
    dependencies=[Depends(get_current_active_system_admin)],
)
async def send_broadcast(
    data: BroadcastCreateRequest,
    current_user: CurrentUser,
    service: BroadcastServiceDep,
) -> Any:
    """
    Sends a message to users.

    - If **target_trust_levels** is empty or null, sends to **ALL** users.
    - If **target_trust_levels** is `[1, 6]`, sends only to users with those specific levels.
    """

    broadcast_stats = await service.create_broadcast(
        sender_id=current_user.id, data=data
    )

    return broadcast_stats


@router.get(
    "/inbox",
    response_model=List[InboxItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Get my messages",
    operation_id="get_my_inbox",
)
async def get_my_inbox(
    current_user: CurrentUser,
    service: BroadcastServiceDep,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> Any:
    """
    Fetch the authenticated user's broadcast inbox.
    """
    return await service.get_user_inbox(
        user_id=current_user.id, limit=limit, offset=offset
    )


@router.patch(
    "/{message_id}/read",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark message as read",
    operation_id="mark_message_read",
)
async def mark_message_read(
    message_id: UUID,
    current_user: CurrentUser,
    service: BroadcastServiceDep,
) -> None:
    """
    Mark a specific inbox item as read.
    """
    await service.mark_as_read(user_id=current_user.id, message_id=message_id)
