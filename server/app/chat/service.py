import json
import logging
import uuid
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.banking.enums import PaymentStatus
from app.banking.models import PaymentRequest
from app.chat.models import ChatMessage, ChatRoom
from app.users.models import User

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_room(
        self,
        buyer: User,
        seller: User,
        listing_id: uuid.UUID,
        listing_title: str,
    ) -> tuple[ChatRoom, bool]:
        """Get existing room or create a new one for a listing inquiry."""
        stmt = select(ChatRoom).where(
            and_(
                ChatRoom.listing_id == listing_id,
                ChatRoom.buyer_id == buyer.id,
                ChatRoom.seller_id == seller.id,
            )
        )
        result = await self.session.execute(stmt)
        room = result.scalar_one_or_none()

        if room:
            return room, False

        room = ChatRoom(
            listing_id=listing_id,
            listing_title=listing_title,
            buyer_id=buyer.id,
            seller_id=seller.id,
        )
        self.session.add(room)
        await self.session.commit()
        await self.session.refresh(room)
        return room, True

    async def get_user_rooms(self, user: User) -> List[Dict[str, Any]]:
        """Get all rooms for a user with last message and unread count."""
        stmt = (
            select(ChatRoom)
            .where(or_(ChatRoom.buyer_id == user.id, ChatRoom.seller_id == user.id))
            .order_by(ChatRoom.created_at.desc())
        )
        result = await self.session.execute(stmt)
        rooms = result.scalars().all()

        summaries = []
        for room in rooms:
            partner_id = room.seller_id if room.buyer_id == user.id else room.buyer_id

            partner_result = await self.session.execute(
                select(User).where(User.id == partner_id)
            )
            partner = partner_result.scalar_one_or_none()

            last_msg_result = await self.session.execute(
                select(ChatMessage)
                .where(ChatMessage.room_id == room.id)
                .order_by(ChatMessage.created_at.desc())
                .limit(1)
            )
            last_msg = last_msg_result.scalar_one_or_none()

            unread_result = await self.session.execute(
                select(ChatMessage).where(
                    and_(
                        ChatMessage.room_id == room.id,
                        ChatMessage.sender_id != user.id,
                        ChatMessage.is_read == False,  # noqa: E712
                    )
                )
            )
            unread_count = len(unread_result.scalars().all())

            summaries.append(
                {
                    "room_id": str(room.id),
                    "listing_title": room.listing_title,
                    "partner_name": (
                        f"{partner.first_name} {partner.last_name}".strip()
                        if partner
                        else "Unknown"
                    ),
                    "partner_code": partner.user_code if partner else "",
                    "last_message": last_msg.content if last_msg else None,
                    "last_ts": (
                        int(last_msg.created_at.timestamp() * 1000) if last_msg else None
                    ),
                    "unread_count": unread_count,
                }
            )

        return summaries

    async def get_room_messages(
        self, user: User, room_id: uuid.UUID, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages for a room and mark received messages as read."""
        await self._get_room_or_403(user, room_id)

        stmt = (
            select(ChatMessage)
            .where(ChatMessage.room_id == room_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        messages = result.scalars().all()

        # Fetch sender names
        sender_ids = list({msg.sender_id for msg in messages})
        sender_map: Dict[uuid.UUID, str] = {}
        for sid in sender_ids:
            sr = await self.session.execute(select(User).where(User.id == sid))
            u = sr.scalar_one_or_none()
            if u:
                sender_map[sid] = f"{u.first_name} {u.last_name}".strip() or u.user_code

        # Resolve live payment request statuses
        payment_status_map: Dict[str, str] = {}
        for msg in messages:
            if msg.message_type == "payment_request" and msg.meta:
                try:
                    meta = json.loads(msg.meta)
                    banking_id = meta.get("banking_request_id")
                    if banking_id:
                        pr_result = await self.session.execute(
                            select(PaymentRequest).where(
                                PaymentRequest.id == uuid.UUID(banking_id)
                            )
                        )
                        pr = pr_result.scalar_one_or_none()
                        if pr:
                            if pr.status == PaymentStatus.EXECUTED:
                                payment_status_map[banking_id] = "paid"
                            elif pr.status in (
                                PaymentStatus.REJECTED,
                                PaymentStatus.CANCELLED,
                                PaymentStatus.FAILED,
                            ):
                                payment_status_map[banking_id] = "denied"
                            else:
                                payment_status_map[banking_id] = "pending"
                except Exception:
                    pass

        # Mark received messages as read
        for msg in messages:
            if msg.sender_id != user.id and not msg.is_read:
                msg.is_read = True
                self.session.add(msg)
        await self.session.commit()

        return [
            self._msg_to_dict(msg, user, sender_map, payment_status_map)
            for msg in messages
        ]

    async def save_message(
        self,
        user: User,
        room_id: uuid.UUID,
        content: str,
        message_type: str,
        meta: Optional[Dict] = None,
    ) -> ChatMessage:
        """Save a new message to the database."""
        await self._get_room_or_403(user, room_id)

        msg = ChatMessage(
            room_id=room_id,
            sender_id=user.id,
            content=content,
            message_type=message_type,
            meta=json.dumps(meta) if meta else None,
        )
        self.session.add(msg)
        await self.session.commit()
        await self.session.refresh(msg)
        return msg

    async def _get_room_or_403(self, user: User, room_id: uuid.UUID) -> ChatRoom:
        stmt = select(ChatRoom).where(
            and_(
                ChatRoom.id == room_id,
                or_(ChatRoom.buyer_id == user.id, ChatRoom.seller_id == user.id),
            )
        )
        result = await self.session.execute(stmt)
        room = result.scalar_one_or_none()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this room.",
            )
        return room

    def _msg_to_dict(
        self,
        msg: ChatMessage,
        current_user: User,
        sender_map: Dict[uuid.UUID, str] = None,
        payment_status_map: Dict[str, str] = None,
    ) -> Dict[str, Any]:
        meta = json.loads(msg.meta) if msg.meta else None
        if meta and payment_status_map:
            banking_id = meta.get("banking_request_id")
            if banking_id and banking_id in payment_status_map:
                meta["payment_status"] = payment_status_map[banking_id]
        sender_name = (sender_map or {}).get(msg.sender_id, "Unknown")
        return {
            "id": str(msg.id),
            "room_id": str(msg.room_id),
            "sender_id": str(msg.sender_id),
            "sender_name": sender_name,
            "content": msg.content,
            "message_type": msg.message_type,
            "meta": meta,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat(),
            "is_own": msg.sender_id == current_user.id,
        }
