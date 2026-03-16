import logging
import uuid
from typing import Dict, List

import jwt
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlmodel import select

from app.auth.config import auth_settings
from app.auth.schemas import TokenPayload
from app.chat.dependencies import ChatServiceDep
from app.chat.schemas import ListingInquiryRequest, RoomResponse
from app.chat.service import ChatService
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.users.dependencies import CurrentUser, UserServiceDep
from app.users.models import User

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# WebSocket Connection Manager
# ============================================================================

class ConnectionManager:
    def __init__(self):
        # room_id -> list of (websocket, user_id, sender_name)
        self.rooms: Dict[str, List[tuple]] = {}

    async def connect(
        self, room_id: str, websocket: WebSocket, user_id: str, sender_name: str
    ):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append((websocket, user_id, sender_name))

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.rooms:
            self.rooms[room_id] = [
                (ws, uid, name)
                for ws, uid, name in self.rooms[room_id]
                if ws is not websocket
            ]

    async def broadcast(
        self, room_id: str, message: dict, exclude_ws: WebSocket = None
    ):
        if room_id not in self.rooms:
            return
        dead = []
        for ws, uid, name in self.rooms[room_id]:
            if exclude_ws and ws is exclude_ws:
                continue
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.rooms[room_id] = [
                (w, u, n) for w, u, n in self.rooms[room_id] if w is not ws
            ]


manager = ConnectionManager()


# ============================================================================
# REST Endpoints
# ============================================================================

@router.get("/rooms", status_code=status.HTTP_200_OK)
async def get_my_rooms(current_user: CurrentUser, service: ChatServiceDep):
    """List all chat rooms for the current user."""
    rooms = await service.get_user_rooms(current_user)
    return {"rooms": rooms}


@router.post("/rooms/inquiry", response_model=RoomResponse, status_code=status.HTTP_200_OK)
async def inquire_listing(
    data: ListingInquiryRequest,
    current_user: CurrentUser,
    user_service: UserServiceDep,
    chat_service: ChatServiceDep,
):
    """Create or retrieve an existing chat room for a listing inquiry."""
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

    room, is_new = await chat_service.get_or_create_room(
        buyer=current_user,
        seller=seller,
        listing_id=data.listing_id,
        listing_title=data.listing_title,
    )
    return RoomResponse(
        room_id=str(room.id),
        listing_title=room.listing_title,
        partner_name=f"{seller.first_name} {seller.last_name}".strip(),
        partner_code=seller.user_code,
        is_new=is_new,
    )


@router.get("/rooms/{room_id}/messages", status_code=status.HTTP_200_OK)
async def get_room_messages(
    room_id: uuid.UUID,
    current_user: CurrentUser,
    chat_service: ChatServiceDep,
    limit: int = 50,
):
    """Fetch message history for a room."""
    messages = await chat_service.get_room_messages(current_user, room_id, limit=limit)
    return {"messages": messages, "has_more": len(messages) >= limit}


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time chat.

    Auth: JWT passed as ?token= query parameter.
    Client sends: {"type": "text"|"payment_request"|"offer_accept"|"offer_reject"|"typing", "content": "...", "meta": {...}}
    Server sends: {"event": "message"|"typing", ...}
    """
    # 1. Authenticate
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[auth_settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        user_id = token_data.sub
        if not user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    async with AsyncSessionLocal() as session:
        # 2. Load user
        result = await session.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            await websocket.close(code=4001)
            return

        # 3. Validate room membership
        service = ChatService(session)
        try:
            room_uuid = uuid.UUID(room_id)
            await service._get_room_or_403(user, room_uuid)
        except HTTPException:
            await websocket.close(code=4003)
            return

        sender_name = f"{user.first_name} {user.last_name}".strip() or user.user_code
        await manager.connect(room_id, websocket, str(user.id), sender_name)

        try:
            while True:
                data = await websocket.receive_json()
                msg_type = data.get("type", "text")

                # Typing indicator — broadcast only, don't persist
                if msg_type == "typing":
                    await manager.broadcast(
                        room_id,
                        {
                            "event": "typing",
                            "sender_name": sender_name,
                            "is_typing": bool(data.get("is_typing", False)),
                        },
                        exclude_ws=websocket,
                    )
                    continue

                content = str(data.get("content", "")).strip()
                meta = data.get("meta")

                if not content:
                    continue

                # Save to DB
                saved = await service.save_message(
                    user=user,
                    room_id=room_uuid,
                    content=content,
                    message_type=msg_type,
                    meta=meta,
                )

                base_payload = {
                    "event": "message",
                    "id": str(saved.id),
                    "room_id": room_id,
                    "sender_id": str(user.id),
                    "sender_name": sender_name,
                    "content": content,
                    "message_type": msg_type,
                    "meta": meta,
                    "is_read": False,
                    "created_at": saved.created_at.isoformat(),
                }

                # Broadcast to others in the room (is_own=False)
                await manager.broadcast(
                    room_id,
                    {**base_payload, "is_own": False},
                    exclude_ws=websocket,
                )

                # Echo back to sender (is_own=True)
                await websocket.send_json({**base_payload, "is_own": True, "is_read": True})

        except WebSocketDisconnect:
            manager.disconnect(room_id, websocket)
