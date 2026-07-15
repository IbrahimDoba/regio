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
from app.core.config import settings
from app.core.file_storage import StorageServiceDep
from app.email.config import email_settings
from app.email.schemas import (
    AdminNewUserEmailData,
    BookingReminderEmailData,
    EmailChangeConfirmData,
    EmailChangeNotifyData,
    VerificationEmailData,
)
from app.email.tasks import (
    send_admin_new_user_email_task,
    send_booking_reminder_email_task,
    send_email_change_confirm_task,
    send_email_change_notify_task,
    send_welcome_email_task,
)
from app.users.config import user_settings
from app.users.dependencies import (
    CurrentAdmin,
    CurrentUser,
    CurrentUserAnyStatus,
    UserServiceDep,
)
from app.users.exceptions import (
    InvalidAvatarFile,
    UserAlreadyExists,
    UserNotFound,
)
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

    # Only send emails on successful registrations
    if db_user:
        verification_url = (
            f"{email_settings.VERIFICATION_URL}"
            f"?id={db_user.id}&lang={db_user.language.lower()}"
        )
        email_data = VerificationEmailData(
            user_first_name=db_user.first_name,
            user_email=db_user.email,
            verification_url=verification_url,
            language=db_user.language,
        )
        background_tasks.add_task(send_welcome_email_task, email_data)
        # Notify the system admin that a new user is pending verification.
        # Queued before the booking reminder because Starlette runs background
        # tasks sequentially and the reminder sleeps 30 minutes before sending —
        # anything queued after it would be blocked for that whole window.
        background_tasks.add_task(
            send_admin_new_user_email_task,
            AdminNewUserEmailData(
                admin_email=settings.SYSTEM_SINK_EMAIL,
                new_user_name=db_user.full_name,
                new_user_email=db_user.email,
                new_user_code=db_user.user_code,
                new_user_city=db_user.city,
                new_user_zip=db_user.zip_code,
            ),
        )
        # Schedule a reminder if the user hasn't booked after 30 minutes (runs
        # last: it sleeps 30 minutes before sending).
        background_tasks.add_task(
            send_booking_reminder_email_task,
            BookingReminderEmailData(
                user_first_name=db_user.first_name,
                user_email=db_user.email,
                verification_url=verification_url,
                language=db_user.language,
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


@router.get(
    "/zip/{zip_code}/cities",
    response_model=list[str],
    status_code=status.HTTP_200_OK,
)
async def get_cities_by_zip(zip_code: str, service: UserServiceDep) -> Any:
    """
    Return the valid city/village names for a Hungarian ZIP code.

    Public endpoint — used during registration to populate the city picker.
    Returns an empty list (not 404) when the ZIP has no matches, so the
    frontend can show a "no cities found" message without treating it as an error.
    """
    if len(zip_code) != 4 or not zip_code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ZIP code must be exactly 4 digits.",
        )
    return await service.get_cities_by_zip(zip_code)


@router.post(
    "/me/request-email-change",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def request_email_change(
    body: dict,
    current_user: CurrentUser,
    service: UserServiceDep,
    background_tasks: BackgroundTasks,
) -> Any:
    """
    Request an email address change.

    Sends a notification to the old address and a confirmation link to the new one.
    """
    new_email = body.get("new_email", "").strip().lower()
    if not new_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="new_email is required.",
        )

    try:
        (
            first_name,
            old_email,
            new_email,
            confirm_url,
        ) = await service.request_email_change(current_user.id, new_email)
    except UserAlreadyExists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already in use.",
        )

    background_tasks.add_task(
        send_email_change_notify_task,
        EmailChangeNotifyData(
            user_first_name=first_name,
            user_email=old_email,
            new_email=new_email,
            language=current_user.language,
        ),
    )
    background_tasks.add_task(
        send_email_change_confirm_task,
        EmailChangeConfirmData(
            user_first_name=first_name,
            user_email=new_email,
            confirm_url=confirm_url,
            language=current_user.language,
        ),
    )

    return {
        "message": "Confirmation emails sent. Please check your new inbox."
    }


@router.post(
    "/me/confirm-email-change",
    response_model=dict,
    status_code=status.HTTP_200_OK,
)
async def confirm_email_change(
    body: dict,
    service: UserServiceDep,
) -> Any:
    """
    Confirm an email address change using the token from the confirmation email.

    This endpoint is intentionally public (no auth required) so that the user
    can confirm from any device by simply clicking the link.
    """
    token = body.get("token", "").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="token is required.",
        )

    try:
        await service.confirm_email_change(token)
    except (ValueError, UserNotFound) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
            if isinstance(e, ValueError)
            else "Invalid or expired confirmation token.",
        )

    return {"message": "Email address updated successfully."}
