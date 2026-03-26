import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ListingInquiryRequest(BaseModel):
    listing_id: uuid.UUID
    listing_title: str
    seller_user_code: str


class MatrixTokenResponse(BaseModel):
    matrix_user_id: str
    matrix_access_token: str
    matrix_homeserver: str


class InquiryRoomResponse(BaseModel):
    matrix_room_id: str


class RoomSummary(BaseModel):
    room_id: str
    matrix_room_id: str
    listing_id: Optional[str] = None
    room_name: Optional[str] = None
    partner_name: str
    partner_code: str


class RoomsListResponse(BaseModel):
    rooms: List[RoomSummary]
