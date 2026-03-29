from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status

from app.broadcast.dependencies import BroadcastServiceDep
from app.broadcast.schemas import (
    BroadcastCreateRequest,
    BroadcastStatsResponse,
    InboxItemResponse,
)
from app.email.schemas import BroadcastDigestEmailData
from app.email.tasks import send_broadcast_digest_emails_task
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
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Sends a message to users.

    - If **target_trust_levels** is empty or null, sends to **ALL** users.
    - If **target_trust_levels** is `[1, 6]`, sends only to users with those specific levels.

    Users with email digest notifications enabled will also receive the
    broadcast content via email.
    """
    broadcast_stats = await service.create_broadcast(
        sender_id=current_user.id, data=data
    )

    recipients = await service.get_email_digest_recipients(
        data.target_trust_levels
    )
    if recipients:
        digest_data = [
            BroadcastDigestEmailData(
                user_first_name=first_name,
                user_email=email,
                broadcast_title=data.title,
                broadcast_body=data.body,
                broadcast_link=data.link,
            )
            for first_name, email in recipients
        ]
        background_tasks.add_task(
            send_broadcast_digest_emails_task, digest_data
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
