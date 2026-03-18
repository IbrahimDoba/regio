import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ListingInquiryRequest(BaseModel):
    listing_id: uuid.UUID
    listing_title: str
    seller_user_code: str


class RoomResponse(BaseModel):
    room_id: str
    listing_title: str
    partner_name: str
    partner_code: str
    is_new: bool = False


class RoomSummary(BaseModel):
    room_id: str
    listing_title: str
    partner_name: str
    partner_code: str
    last_message: Optional[str] = None
    last_ts: Optional[int] = None
    unread_count: int = 0


class JoinedRoomsResponse(BaseModel):
    rooms: List[RoomSummary]


class MessageOut(BaseModel):
    id: str
    room_id: str
    sender_id: str
    sender_name: str
    content: str
    message_type: str
    meta: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime
    is_own: bool = False


class MessagesResponse(BaseModel):
    messages: List[MessageOut]
    has_more: bool = False
