import logging
from typing import List
from uuid import UUID

from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.broadcast.exceptions import BroadcastNotFound
from app.broadcast.models import Broadcast, UserBroadcast
from app.broadcast.schemas import (
    BroadcastCreateRequest,
    BroadcastStatsResponse,
    InboxItemResponse,
)
from app.users.models import User

logger = logging.getLogger(__name__)


class BroadcastService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_broadcast(
        self, sender_id: UUID, data: BroadcastCreateRequest
    ) -> BroadcastStatsResponse:
        """
        Creates a broadcast and fans it out to the target users.
        Returns the number of users targeted.
        """
        # Create the Master Broadcast Record
        broadcast = Broadcast(
            title=data.title,
            body=data.body,
            link=data.link,
            sender_id=sender_id,
            target_trust_levels=data.target_trust_levels,
        )
        self.session.add(broadcast)
        await self.session.flush()  # Flush to get broadcast.id

        # Determine Recipients
        stmt = select(User.id)

        # Apply Filter if provided
        if data.target_trust_levels and len(data.target_trust_levels) > 0:
            stmt = stmt.where(User.trust_level.in_(data.target_trust_levels))

        # Execute query to get all target User IDs
        result = await self.session.execute(stmt)
        user_ids = result.scalars().all()

        if not user_ids:
            logger.warning(
                "Broadcast created but no users matched the filter."
            )
            return BroadcastStatsResponse(
                broadcast_id=broadcast.id,
                recipient_count=len(user_ids),
                created_at=broadcast.created_at,
            )

        # Bulk Create Inbox Items (Efficient)
        inbox_items = [
            UserBroadcast(user_id=uid, broadcast_id=broadcast.id)
            for uid in user_ids
        ]

        self.session.add_all(inbox_items)
        await self.session.commit()

        # TODO: Fire Background Task for Push Notifications here (celery & redis queue)
        # background_tasks.add_task(send_push_notification, user_ids, data.title)

        logger.info(f"Broadcast '{data.title}' sent to {len(user_ids)} users.")
        return BroadcastStatsResponse(
            broadcast_id=broadcast.id,
            recipient_count=len(user_ids),
            created_at=broadcast.created_at,
        )

    async def get_user_inbox(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> List[InboxItemResponse]:
        """
        Fetches the user's messages, joining with the Broadcast table
        to get the actual content (title, body, etc).
        """
        stmt = (
            select(UserBroadcast, Broadcast)
            .join(Broadcast, UserBroadcast.broadcast_id == Broadcast.id)
            .where(UserBroadcast.user_id == user_id)
            .order_by(desc(UserBroadcast.created_at))
            .limit(limit)
            .offset(offset)
        )

        result = await self.session.execute(stmt)
        rows = result.all()

        # Manually map the join result to the Schema
        response_items = []
        for user_msg, broadcast_data in rows:
            response_items.append(
                InboxItemResponse(
                    id=user_msg.id,
                    broadcast_id=broadcast_data.id,
                    title=broadcast_data.title,
                    body=broadcast_data.body,
                    link=broadcast_data.link,
                    is_read=user_msg.is_read,
                    created_at=user_msg.created_at,
                )
            )

        return response_items

    async def mark_as_read(self, user_id: UUID, message_id: UUID) -> None:
        """
        Marks a specific inbox item as read.
        Enforces that the message actually belongs to the user.
        """
        stmt = (
            update(UserBroadcast)
            .where(UserBroadcast.id == message_id)
            .where(UserBroadcast.user_id == user_id)
            .values(is_read=True)
        )

        result = await self.session.execute(stmt)
        await self.session.commit()

        if result.rowcount == 0:
            raise BroadcastNotFound(
                "Message not found or does not belong to user."
            )
