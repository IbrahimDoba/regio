import logging
import re
import secrets
import string
from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx
from cryptography.fernet import Fernet
from fastapi import HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.config import chat_settings
from app.chat.schemas import RoomResponse
from app.chat.exceptions import MatrixUserCollisionError
from app.core.config import settings as global_settings
from app.users.models import User

logger = logging.getLogger(__name__)

# Initialize Encryption Tool
cipher = Fernet(chat_settings.MATRIX_ENCRYPTION_KEY)


class ChatService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.base_url = chat_settings.MATRIX_HOMESERVER_URL.rstrip("/")
        self.domain = chat_settings.MATRIX_DOMAIN
        self.admin_user = chat_settings.MATRIX_ADMIN_USER
        self.admin_pass = chat_settings.MATRIX_ADMIN_PASSWORD
        self.registration_token = chat_settings.MATRIX_REGISTRATION_TOKEN
        self.redis = Redis.from_url(global_settings.REDIS_URL, decode_responses=True)

    def _encrypt_password(self, password: str) -> str:
        """Encrypts plain password for DB storage."""
        return cipher.encrypt(password.encode()).decode()

    def _decrypt_password(self, encrypted_password: str) -> str:
        """Decrypts DB password for usage."""
        return cipher.decrypt(encrypted_password.encode()).decode()

    async def _get_matrix_password(self, user: User) -> str:
        """
        Retrieves the Matrix password.
        1. If it exists in DB -> Decrypt and return.
        2. If not (or decrypt fails) -> Generate Random, Encrypt, Save to DB, return.
        """
        if user.matrix_password:
            try:
                return self._decrypt_password(user.matrix_password)
            except Exception as e:
                logger.error(
                    f"Decryption failed for user {user.id}: {e}. Resetting password."
                )

        # Generate new random password (secure, not deterministic)
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        new_password = "".join(secrets.choice(alphabet) for i in range(32))

        # Save encrypted version to DB
        user.matrix_password = self._encrypt_password(new_password)
        self.session.add(user)

        # UserService caller handles the commit
        # await self.session.commit()
        await self.session.flush()
        await self.session.refresh(user)

        return new_password

    def _sanitize_username(self, user_code: str) -> str:
        """Matrix usernames must be lowercase and devoid of special chars."""
        # Remove anything that isn't alphanumeric, dot, hypen, or underscore
        clean = re.sub(r"[^a-z0-9\.\-_]", "", user_code.lower())
        return clean

    def _get_matrix_user_id(self, user_code: str) -> str:
        """
        Formats a user code into a Matrix ID.
        Example: 'User-123' -> '@regiouser123:matrix.000.jj'
        """
        # Remove anything that isn't alphanumeric or underscore for the handle
        clean_code = re.sub(r"[^a-z0-9_]", "", user_code.lower())
        return f"@regio_{clean_code}:{self.domain}"
    
    async def is_user_id_available(self, user_code: str) -> bool:
        """
        Checks if the Matrix ID is available on the server.
        """
        username = self._sanitize_username(user_code)

        url = f"{self.base_url}/_matrix/client/v3/register/available"
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, params={"username": username})
                # 200 means available. 400 M_USER_IN_USE means taken.
                return resp.status_code == 200
            except Exception:
                # If check fails, assume safe to try registering (and let it fail later if needed)
                return True

    async def _set_display_name(self, user: User, token: str):
        """
        Sets the user's Matrix display name to match their App name.
        Example: "John Doe" instead of "@user123:server"
        """
        user_id = self._get_matrix_user_id(user.user_code)
        display_name = f"{user.first_name} {user.last_name}".strip()
        if not display_name:
            display_name = user.user_code

        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}/_matrix/client/v3/profile/{user_id}/displayname"
                await client.put(
                    url,
                    headers={"Authorization": f"Bearer {token}"},
                    json={"displayname": display_name},
                )
            except Exception as e:
                logger.warning(f"Failed to set display name for {user_id}: {e}")

    async def _handle_registration_success(
        self, resp: httpx.Response, user: User
    ) -> Optional[str]:
        """Helper to process successful registration response"""
        data = resp.json()
        user_id = data.get("user_id")
        access_token = data.get("access_token")

        logger.info(f"Successfully registered Matrix user: {user_id}")

        if access_token:
            await self._set_display_name(user, access_token)

        return user_id

    async def register_user(self, user: User) -> Optional[str]:
        """
        Provisions a Matrix account using the UIA flow (User-Interactive Auth).
        Handles multi-stage auth (Registration Token -> Dummy) robustly.
        """
        matrix_id = self._get_matrix_user_id(user.user_code)
        matrix_password = await self._get_matrix_password(user)

        # Calculate username with prefix to match the ID format
        clean_code = re.sub(r"[^a-z0-9_]", "", user.user_code.lower())
        username = f"regio_{clean_code}"

        payload_base = {
            "username": username,
            "password": matrix_password,
        }

        async with httpx.AsyncClient() as client:
            try:
                reg_url = f"{self.base_url}/_matrix/client/v3/register?kind=user"

                # Initial Attempt: Send Token immediately
                initial_auth = {
                    "type": "m.login.registration_token",
                    "token": self.registration_token,
                }

                resp = await client.post(
                    reg_url, json={**payload_base, "auth": initial_auth}
                )

                # Case A: Success immediately
                if resp.status_code == 200:
                    return await self._handle_registration_success(resp, user)

                # Case B: User already exists
                if (
                    resp.status_code == 400
                    and resp.json().get("errcode") == "M_USER_IN_USE"
                ):
                    logger.info(
                        f"Matrix user {matrix_id} already exists. Skipping registration."
                    )
                    raise MatrixUserCollisionError(f"Matrix user {matrix_id} already exists")

                # Case C: Interactive Auth (The Standard Path)
                if resp.status_code == 401:
                    data = resp.json()
                    session = data.get("session")
                    completed = data.get("completed", [])

                    if not session:
                        logger.error(
                            f"Matrix Registration failed: No session returned. Data: {data}"
                        )
                        return None

                    """Check stages and retry missed ones using the Session ID"""

                    # STAGE 1: Registration Token
                    # If the server didn't mark it as completed in the first step (common),
                    # we must send it again attached to the session.
                    if "m.login.registration_token" not in completed:
                        auth_token = {
                            "type": "m.login.registration_token",
                            "token": self.registration_token,
                            "session": session,
                        }
                        resp = await client.post(
                            reg_url, json={**payload_base, "auth": auth_token}
                        )

                        if resp.status_code == 200:
                            return await self._handle_registration_success(resp, user)

                        if resp.status_code == 401:
                            # Update completed list from latest response
                            completed = resp.json().get("completed", [])
                        else:
                            # Failed
                            logger.error(
                                f"Matrix Token Registration failed: {resp.text}"
                            )
                            return None

                    # STAGE 2: Dummy Auth
                    if "m.login.dummy" not in completed:
                        auth_dummy = {"type": "m.login.dummy", "session": session}
                        resp = await client.post(
                            reg_url, json={**payload_base, "auth": auth_dummy}
                        )

                        if resp.status_code == 200:
                            return await self._handle_registration_success(resp, user)

                        logger.error(f"Matrix Dummy Registration failed: {resp.text}")
                        return None

                # Catch-all
                logger.error(
                    f"Matrix Registration ended with status {resp.status_code}: {resp.text}"
                )
                return None

            except Exception as e:
                logger.error(f"Matrix Registration Exception: {e}")
                return None

    async def get_user_access_token(self, user: User) -> Dict[str, Any]:
        """
        Generates a login session for the Frontend (Matrix Handshake).
        If login fails, it attempts Just-In-Time (JIT) registration.
        """

        # Retrieve the specific random password for this user
        matrix_password = await self._get_matrix_password(user)
        matrix_id = self._get_matrix_user_id(user.user_code)

        async with httpx.AsyncClient() as client:
            try:
                # Attempt Login
                resp = await client.post(
                    f"{self.base_url}/_matrix/client/v3/login",
                    json={
                        "type": "m.login.password",
                        "identifier": {"type": "m.id.user", "user": matrix_id},
                        "password": matrix_password,
                    },
                )
                resp.raise_for_status()
                return resp.json()

            except Exception:
                print(resp.json())
                logger.warning(
                    f"Matrix Login failed for {matrix_id}. Attempting JIT registration."
                )

                # Attempt Registration (idempotent-ish)
                reg_result = await self.register_user(user)
                if not reg_result:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Matrix registration failed during handshake.",
                    )

                # Retry Login
                resp_retry = await client.post(
                    f"{self.base_url}/_matrix/client/v3/login",
                    json={
                        "type": "m.login.password",
                        "identifier": {"type": "m.id.user", "user": matrix_id},
                        "password": matrix_password,
                    },
                )
                resp_retry.raise_for_status()
                return resp_retry.json()

    async def join_or_create_listing_room(
        self, buyer: User, seller: User, listing_id: UUID, listing_title: str
    ) -> RoomResponse:
        """
        Contextual Rooms.
        """

        # Define room alias
        alias_local_part = f"listing_{listing_id}_{buyer.id}"
        room_alias = f"#{alias_local_part}:{self.domain}"

        # Get Buyer's Token (We act as the Buyer)
        session_data = await self.get_user_access_token(buyer)
        buyer_token = session_data["access_token"]

        # Ensure Seller exists in Matrix before sending invite
        seller_matrix_id = self._get_matrix_user_id(seller.user_code)
        await self.register_user(seller)

        async with httpx.AsyncClient() as client:
            # Check if room exists (Try to resolve it)
            try:
                resolve_resp = await client.get(
                    f"{self.base_url}/_matrix/client/v3/directory/room/{room_alias}",
                    headers={"Authorization": f"Bearer {buyer_token}"},
                )

                if resolve_resp.status_code == 200:
                    # Room exists, return ID
                    room_id = resolve_resp.json().get("room_id")

                    return RoomResponse(room_id=room_id, alias=room_alias, is_new=False)

                elif resolve_resp.status_code == 404:
                    # Create Room if 404
                    logger.info(
                        f"Alias {room_alias} not found. Creating new listing room."
                    )

                    payload = {
                        "name": listing_title,
                        "topic": f"Transaction regarding: {listing_title}",
                        "room_alias_name": alias_local_part,  # Only the local part
                        "visibility": "private",
                        "preset": "trusted_private_chat",  # Implies invite-only, shared history
                        "invite": [seller_matrix_id],
                        "is_direct": True,
                        "initial_state": [
                            # ENABLE ENCRYPTION IMMEDIATELY
                            {
                                "type": "m.room.encryption",
                                "state_key": "",
                                "content": {"algorithm": "m.megolm.v1.aes-sha2"},
                            }
                        ],
                    }

                    create_resp = await client.post(
                        f"{self.base_url}/_matrix/client/v3/createRoom",
                        headers={"Authorization": f"Bearer {buyer_token}"},
                        json=payload,
                    )

                    if create_resp.status_code == 403:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="User not authorized to create room aliases.",
                        )

                    create_resp.raise_for_status()
                    room_id = create_resp.json()["room_id"]

                    return RoomResponse(room_id=room_id, alias=room_alias, is_new=True)

                else:
                    resolve_resp.raise_for_status()

            except httpx.HTTPStatusError as e:
                logger.error(f"Matrix API Error: {e.response.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to communicate with Matrix Server",
                )

    async def create_room(
        self, creator: User, invitees: List[User], name: str = None, topic: str = None
    ) -> str:
        """
        Standard generic room creation (Fallback or manual creation).
        """
        session_data = await self.get_user_access_token(creator)
        user_token = session_data["access_token"]

        # Ensure invitees exist
        for u in invitees:
            await self.register_user(u)

        invite_ids = [self._get_matrix_user_id(u.user_code) for u in invitees]

        async with httpx.AsyncClient() as client:
            payload = {
                "name": name,
                "topic": topic,
                "preset": "private_chat",
                "invite": invite_ids,
                "is_direct": True if len(invitees) == 1 else False,
                "initial_state": [
                    {
                        "type": "m.room.encryption",
                        "state_key": "",
                        "content": {"algorithm": "m.megolm.v1.aes-sha2"},
                    }
                ],
            }

            resp = await client.post(
                f"{self.base_url}/_matrix/client/v3/createRoom",
                headers={"Authorization": f"Bearer {user_token}"},
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()["room_id"]

    async def get_joined_rooms(self, user: User) -> List[str]:
        """
        Fetches the list of rooms the user has joined.
        """
        session_data = await self.get_user_access_token(user)
        user_token = session_data["access_token"]

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/_matrix/client/v3/joined_rooms",
                headers={"Authorization": f"Bearer {user_token}"},
            )
            resp.raise_for_status()
            return resp.json().get("joined_rooms", [])
