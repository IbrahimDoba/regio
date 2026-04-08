"""
Matrix service layer — business logic for user provisioning, token management,
and room creation.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.matrix_crypto import (
    decrypt_password,
    encrypt_password,
    generate_secure_password,
)
from app.chat.matrix_http import (
    create_room_as_user,
    join_room_as_user,
    login_matrix_user,
    register_matrix_user_uia,
)
from app.chat.models import (
    MatrixRegistrationStats,
    MatrixRoom,
    MatrixRoomParticipant,
    MatrixUserCredentials,
)
from app.core.config import settings
from app.users.models import User

logger = logging.getLogger(__name__)


def _matrix_username_for_user(user: User) -> str:
    """Derive a Matrix localpart from the platform user's UUID."""
    return f"immo_{str(user.id).replace('-', '')}"


async def check_registration_limit(db: AsyncSession) -> bool:
    """Return True if we can still register new Matrix users."""
    result = await db.execute(select(MatrixRegistrationStats).limit(1))
    stats = result.scalar_one_or_none()
    if stats is None:
        return True
    return stats.users_created < stats.token_limit


async def increment_registration_count(db: AsyncSession) -> None:
    result = await db.execute(select(MatrixRegistrationStats).limit(1))
    stats = result.scalar_one_or_none()
    if stats is None:
        stats = MatrixRegistrationStats(
            users_created=1,
            token_limit=300,
            token_expiry=datetime.now(timezone.utc),
            last_updated=datetime.now(timezone.utc),
        )
        db.add(stats)
    else:
        stats.users_created += 1
        stats.last_updated = datetime.now(timezone.utc)
        db.add(stats)
    await db.commit()


async def ensure_matrix_user(
    user_id: uuid.UUID, db: AsyncSession
) -> tuple[str, str]:
    """
    Ensure the platform user has a Matrix account.
    Returns (matrix_user_id, plaintext_access_token).
    If the user already has a Matrix account, decrypts and returns credentials.
    Otherwise, registers a new Matrix account and persists credentials.
    """
    # Load user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Already registered?
    if user.matrix_user_id:
        access_token = await get_matrix_access_token(user_id, db)
        return user.matrix_user_id, access_token

    # Check registration limit before creating
    if not await check_registration_limit(db):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Matrix registration limit reached",
        )

    # Generate credentials
    username = _matrix_username_for_user(user)
    plain_password = generate_secure_password()
    encrypted_password = encrypt_password(plain_password)

    # Register on Matrix homeserver
    reg_result = await register_matrix_user_uia(username, plain_password)
    matrix_user_id = reg_result["user_id"]
    access_token = reg_result["access_token"]
    device_id = reg_result["device_id"]
    encrypted_token = encrypt_password(access_token)

    # Persist to DB
    user.matrix_user_id = matrix_user_id
    user.matrix_password = encrypted_password
    db.add(user)

    creds = MatrixUserCredentials(
        user_id=user.id,
        access_token=encrypted_token,
        device_id=device_id,
        home_server=settings.MATRIX_HOMESERVER,
        last_login_at=datetime.now(timezone.utc),
    )
    db.add(creds)
    await db.commit()
    await db.refresh(user)

    await increment_registration_count(db)

    return matrix_user_id, access_token


async def get_matrix_access_token(user_id: uuid.UUID, db: AsyncSession) -> str:
    """
    Return a valid Matrix access token for the user.
    Tries cached credentials first; falls back to a fresh login.
    """
    result = await db.execute(
        select(MatrixUserCredentials).where(
            MatrixUserCredentials.user_id == user_id
        )
    )
    creds = result.scalar_one_or_none()

    if creds:
        try:
            return decrypt_password(creds.access_token)
        except Exception:
            pass

    # Fallback: re-login with stored password
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.matrix_password or not user.matrix_user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matrix credentials not found for user",
        )

    plain_password = decrypt_password(user.matrix_password)
    # matrix_user_id is like @immo_<uuid>:151.hu — extract localpart
    localpart = user.matrix_user_id.split(":")[0].lstrip("@")
    login_result = await login_matrix_user(localpart, plain_password)
    new_token = login_result["access_token"]
    encrypted_token = encrypt_password(new_token)

    if creds:
        creds.access_token = encrypted_token
        creds.last_login_at = datetime.now(timezone.utc)
        db.add(creds)
    else:
        creds = MatrixUserCredentials(
            user_id=user_id,
            access_token=encrypted_token,
            device_id=login_result.get("device_id", ""),
            home_server=settings.MATRIX_HOMESERVER,
            last_login_at=datetime.now(timezone.utc),
        )
        db.add(creds)
    await db.commit()

    return new_token


async def get_or_create_inquiry_room(
    listing_id: uuid.UUID,
    buyer_id: uuid.UUID,
    seller_id: uuid.UUID,
    listing_title: str,
    db: AsyncSession,
) -> str:
    """
    Get or create a Matrix room for a listing inquiry.
    Returns the matrix_room_id.
    """
    # Check for existing room with this listing + buyer
    participant_stmt = (
        select(MatrixRoomParticipant)
        .where(MatrixRoomParticipant.user_id == buyer_id)
        .join(MatrixRoom, MatrixRoom.id == MatrixRoomParticipant.room_id)
        .where(MatrixRoom.listing_id == listing_id)
    )
    result = await db.execute(participant_stmt)
    existing_participant = result.scalar_one_or_none()

    if existing_participant:
        room_result = await db.execute(
            select(MatrixRoom).where(
                MatrixRoom.id == existing_participant.room_id
            )
        )
        room = room_result.scalar_one_or_none()
        if room:
            return room.matrix_room_id

    # Ensure both users have Matrix accounts; get their tokens
    buyer_matrix_id, buyer_token = await ensure_matrix_user(buyer_id, db)
    seller_matrix_id, seller_token = await ensure_matrix_user(seller_id, db)

    # Buyer creates the room and invites the seller
    room_name = f"{listing_title[:50]} — inquiry"
    matrix_room_id = await create_room_as_user(
        name=room_name,
        creator_access_token=buyer_token,
        invite_matrix_id=seller_matrix_id,
    )

    # Seller accepts the invite using their own token
    await join_room_as_user(matrix_room_id, seller_token)

    # Persist room record
    room = MatrixRoom(
        matrix_room_id=matrix_room_id,
        listing_id=listing_id,
        room_name=room_name,
        created_by_id=buyer_id,
    )
    db.add(room)
    await db.flush()  # get room.id

    # Persist participants
    db.add(
        MatrixRoomParticipant(
            room_id=room.id,
            user_id=buyer_id,
            matrix_user_id=buyer_matrix_id,
        )
    )
    db.add(
        MatrixRoomParticipant(
            room_id=room.id,
            user_id=seller_id,
            matrix_user_id=seller_matrix_id,
        )
    )
    await db.commit()

    return matrix_room_id


async def get_user_rooms(
    user_id: uuid.UUID, db: AsyncSession
) -> list[dict[str, Any]]:
    """
    Return a summary of all Matrix rooms the user participates in.
    """
    stmt = (
        select(MatrixRoomParticipant, MatrixRoom)
        .join(MatrixRoom, MatrixRoom.id == MatrixRoomParticipant.room_id)
        .where(MatrixRoomParticipant.user_id == user_id)
        .order_by(MatrixRoom.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    rooms = []
    for participant, room in rows:
        # Find the other participant
        partner_stmt = (
            select(MatrixRoomParticipant, User)
            .join(User, User.id == MatrixRoomParticipant.user_id)
            .where(MatrixRoomParticipant.room_id == room.id)
            .where(MatrixRoomParticipant.user_id != user_id)
        )
        partner_result = await db.execute(partner_stmt)
        partner_row = partner_result.first()

        partner_name = "Unknown"
        partner_code = ""
        if partner_row:
            _, partner_user = partner_row
            partner_name = (
                f"{partner_user.first_name} {partner_user.last_name}".strip()
            )
            partner_code = partner_user.user_code

        rooms.append(
            {
                "room_id": room.matrix_room_id,
                "matrix_room_id": room.matrix_room_id,
                "listing_id": str(room.listing_id)
                if room.listing_id
                else None,
                "room_name": room.room_name or partner_name,
                "partner_name": partner_name,
                "partner_code": partner_code,
            }
        )

    return rooms
