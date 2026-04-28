import io
from typing import Any, List

from fastapi import (
    APIRouter,
    BackgroundTasks,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse

from app.auth.dependencies import AuthServiceDep
from app.auth.schemas import InvitePublic
from app.core.file_storage import StorageServiceDep
from app.email.config import email_settings
from app.email.schemas import VerificationEmailData
from app.email.tasks import send_welcome_email_task
from app.users.config import user_settings
from app.users.dependencies import (
    CurrentAdmin,
    CurrentUser,
    CurrentUserAnyStatus,
    UserServiceDep,
)
from app.users.exceptions import InvalidAvatarFile, UserNotFound
from app.users.schemas import UserCreate, UserPublic, UsersPublic, UserUpdate

router = APIRouter()


@router.get(
    "",
    response_model=UsersPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        }
    },
)
async def read_users(
    service: UserServiceDep, _: CurrentAdmin, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve users with pagination.

    Only accessible by Admins. Returns a list of all registered users
    with pagination support.

    - **skip**: Number of records to skip.
    - **limit**: Maximum number of records to return.
    """
    return await service.get_users(skip, limit)


@router.get(
    "/search",
    response_model=List[UserPublic],
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        }
    },
)
async def search_users(
    service: UserServiceDep,
    _: CurrentUser,
    q: str = Query(
        min_length=2, description="Search string (name or user code)."
    ),
    limit: int = 10,
) -> Any:
    """
    Search users by name or code for autocomplete.

    Useful for features like "Send Money" or "Invite" where you need to find
    another user in the system.

    - **q**: The search query (minimum 2 characters).
    - **limit**: Max results to return (default 10).
    """
    return await service.search_users(q, limit)


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Invalid invite code or input data."
        },
        status.HTTP_409_CONFLICT: {"description": "Email already registered."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "System saturated (no IDs left) or internal error."
        },
    },
)
async def register_user(
    user_in: UserCreate,
    service: UserServiceDep,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Public registration endpoint.

    Requires a valid Invite Code to create a new account.
    The system automatically assigns a unique 5-digit User Code upon success.
    A welcome email with a Calendar verification booking link is sent
    asynchronously after registration.

    - **user_in**: Registration payload including invite code and profile data.
    """
    db_user = await service.create_user(user_in)

    background_tasks.add_task(
        send_welcome_email_task,
        VerificationEmailData(
            user_first_name=db_user.first_name,
            user_email=db_user.email,
            calendly_url=email_settings.CALENDLY_URL,
        ),
    )

    return db_user


@router.get("/me", response_model=UserPublic, status_code=status.HTTP_200_OK)
async def read_user_me(current_user: CurrentUserAnyStatus) -> Any:
    """
    Get current user profile.

    Returns the public profile information of the currently logged-in user.
    """
    return current_user


@router.patch(
    "/me",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Attempted to update immutable field (e.g. Real Name)."
        },
        status.HTTP_404_NOT_FOUND: {"description": "User not found."},
    },
)
async def update_user_me(
    user_in: UserUpdate, current_user: CurrentUser, service: UserServiceDep
) -> Any:
    """
    Update own profile.

    Allows updating mutable fields like address or bio.
    Real Names (First/Last) are **immutable** and cannot be changed here.

    - **user_in**: Fields to update.
    """
    return await service.update_user(current_user.id, user_in)


@router.put(
    "/me/avatar",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "File is not a JPEG or PNG, or exceeds 5 MB."
        },
        status.HTTP_404_NOT_FOUND: {"description": "User not found."},
    },
)
async def upload_avatar(
    file: UploadFile,
    current_user: CurrentUser,
    service: UserServiceDep,
    storage: StorageServiceDep,
) -> Any:
    """
    Upload a profile picture.

    Accepts JPEG or PNG images up to 5 MB. Replaces any existing avatar.
    The image is compressed and stored on the server.
    """
    try:
        return await service.upload_avatar(current_user.id, file, storage)
    except InvalidAvatarFile as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=e.detail
        )


@router.get(
    "/invites",
    response_model=List[InvitePublic],
    status_code=status.HTTP_200_OK,
)
async def read_my_invites(
    current_user: CurrentUser, service: AuthServiceDep
) -> Any:
    """
    Get the invite codes for the current user.

    Returns the user's available invite codes (Limited to most recent 3).
    These codes can be shared with others to allow them to register.
    """
    return await service.get_user_invites(current_user.id)


@router.get(
    path="/invites/request",
    response_model=List[InvitePublic],
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def request_new_invites(
    current_user: CurrentUser,
    auth_service: AuthServiceDep,
) -> List[InvitePublic]:
    """
    Void existing unused invites and generate 3 new ones.
    """
    return await auth_service.request_invites(current_user.id)


@router.get(
    "/{user_code}/avatar",
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "User or avatar not found."
        },
    },
)
async def get_user_avatar(
    user_code: str,
    _: CurrentUser,
    service: UserServiceDep,
    storage: StorageServiceDep,
) -> StreamingResponse:
    """
    Fetch a user's profile picture.

    Returns the raw image bytes with the appropriate Content-Type header.
    Use this URL wherever you need to display a user's avatar in the frontend.
    """
    user = await service.get_user_by_code(user_code)
    if not user or not user.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found"
        )

    data = await storage.get_bytes(user.avatar_url)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found"
        )

    ext = (
        user.avatar_url.rsplit(".", 1)[-1].lower()
        if "." in user.avatar_url
        else "jpg"
    )
    media_type = "image/png" if ext == "png" else "image/jpeg"

    return StreamingResponse(io.BytesIO(data), media_type=media_type)


@router.get(
    "/{user_code}",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_403_FORBIDDEN: {"description": "User is not an admin."},
        status.HTTP_404_NOT_FOUND: {
            "description": "User with this code not found."
        },
    },
)
async def read_user_by_code(
    user_code: str, _: CurrentUser, service: UserServiceDep
) -> Any:
    """
    Admin: Get specific user by code.

    Fetch a user's profile using their UUID or internal code.

    - **user_code**: The identifier of the user to fetch.
    """

    if user_code.upper() == user_settings.SYSTEM_SINK_CODE:
        raise UserNotFound()

    user = await service.get_user_by_code(user_code)
    if not user:
        raise UserNotFound()
    return user
