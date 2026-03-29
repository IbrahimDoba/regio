"""
Raw async HTTP client for the Matrix homeserver.

All calls go directly to the Matrix REST API via httpx.
No Matrix SDK is used on the server side.
"""

import logging
from typing import Any, Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

async def matrix_fetch(
    endpoint: str,
    method: str = "GET",
    body: Optional[dict] = None,
    access_token: Optional[str] = None,
) -> dict[str, Any]:
    """
    Base helper for Matrix HTTP calls.
    endpoint: path starting with / e.g. /_matrix/client/v3/register
    Raises HTTPException on non-2xx responses.
    """
    url = f"{settings.MATRIX_HOMESERVER}{endpoint}"
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(
            method=method.upper(),
            url=url,
            json=body,
            headers=headers,
        )

    if not response.is_success:
        error_body = {}
        try:
            error_body = response.json()
        except Exception:
            pass
        errcode = error_body.get("errcode", "UNKNOWN")
        error_msg = error_body.get("error", response.text)
        logger.error(
            "Matrix API error %s %s → %s %s: %s",
            method,
            endpoint,
            response.status_code,
            errcode,
            error_msg,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Matrix error [{errcode}]: {error_msg}",
        )

    return response.json()


async def register_matrix_user_uia(username: str, password: str) -> dict[str, Any]:
    """
    Register a new Matrix user using the 3-step UIA flow:
      1. Initial POST → get session ID
      2. POST with registration_token auth → mark token stage complete
      3. POST with dummy auth → finalise and get credentials

    Returns {"user_id": ..., "access_token": ..., "device_id": ...}
    """
    base_body = {
        "username": username,
        "password": password,
        "kind": "user",
    }
    endpoint = "/_matrix/client/v3/register"

    # Step 1: start UIA flow, get session
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r1 = await client.post(
                f"{settings.MATRIX_HOMESERVER}{endpoint}",
                json=base_body,
                headers={"Content-Type": "application/json"},
            )
        # Expect 401 with session info
        r1_data = r1.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Matrix UIA step 1 failed: {exc}",
        )

    session = r1_data.get("session")
    if not session:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Matrix UIA: no session returned in step 1",
        )

    # Step 2: authenticate with registration token
    step2_body = {
        **base_body,
        "auth": {
            "type": "m.login.registration_token",
            "session": session,
            "token": settings.MATRIX_REGISTRATION_TOKEN,
        },
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r2 = await client.post(
                f"{settings.MATRIX_HOMESERVER}{endpoint}",
                json=step2_body,
                headers={"Content-Type": "application/json"},
            )
        r2_data = r2.json()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Matrix UIA step 2 failed: {exc}",
        )

    # If already complete (some servers finish in 2 steps)
    if "access_token" in r2_data:
        return {
            "user_id": r2_data["user_id"],
            "access_token": r2_data["access_token"],
            "device_id": r2_data.get("device_id", ""),
        }

    # Step 3: dummy auth to finalise
    step3_body = {
        **base_body,
        "auth": {
            "type": "m.login.dummy",
            "session": session,
        },
    }
    r3_data = await matrix_fetch(endpoint, method="POST", body=step3_body)

    if "access_token" not in r3_data:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Matrix UIA: registration did not return access_token",
        )

    return {
        "user_id": r3_data["user_id"],
        "access_token": r3_data["access_token"],
        "device_id": r3_data.get("device_id", ""),
    }


async def login_matrix_user(username: str, password: str) -> dict[str, Any]:
    """
    Login an existing Matrix user with m.login.password.
    Returns {"user_id": ..., "access_token": ..., "device_id": ...}
    """
    body = {
        "type": "m.login.password",
        "identifier": {
            "type": "m.id.user",
            "user": username,
        },
        "password": password,
    }
    data = await matrix_fetch("/_matrix/client/v3/login", method="POST", body=body)
    return {
        "user_id": data["user_id"],
        "access_token": data["access_token"],
        "device_id": data.get("device_id", ""),
    }


async def create_room_as_user(
    name: str,
    creator_access_token: str,
    invite_matrix_id: str,
) -> str:
    """
    Create a private Matrix room as the buyer (creator_access_token),
    immediately inviting the seller (invite_matrix_id).
    Returns the matrix_room_id.
    """
    body: dict[str, Any] = {
        "name": name,
        "preset": "private_chat",
        "visibility": "private",
        "invite": [invite_matrix_id],
    }
    data = await matrix_fetch(
        "/_matrix/client/v3/createRoom",
        method="POST",
        body=body,
        access_token=creator_access_token,
    )
    return data["room_id"]


async def join_room_as_user(matrix_room_id: str, access_token: str) -> None:
    """
    Accept a pending room invite — called server-side using the invitee's
    own access token.
    """
    await matrix_fetch(
        f"/_matrix/client/v3/join/{matrix_room_id}",
        method="POST",
        body={},
        access_token=access_token,
    )
