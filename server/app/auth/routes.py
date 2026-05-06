from typing import Annotated, Any, Optional

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.auth.dependencies import AuthServiceDep
from app.auth.schemas import PasswordResetConfirm, PasswordResetRequest, TokenResponse
from app.auth.utils import set_refresh_cookie
from app.core.schemas import Message
from app.email.tasks import send_password_reset_email_task
from app.users.dependencies import CurrentUser
from app.users.schemas import UserPublic

router = APIRouter()


@router.post(
    "/login/access-token",
    response_model=TokenResponse,
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Incorrect email or password"
        },
        status.HTTP_400_BAD_REQUEST: {"description": "Inactive user account"},
        status.HTTP_403_FORBIDDEN: {"description": "Account not verified"},
    },
)
async def login_access_token(
    response: Response,
    service: AuthServiceDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Any:
    """
    Login with Email and Password.

    Returns a short-lived **Access Token** in the response body and Refresh Token in HttpOnly Cookie.

    - **username**: User's email address.
    - **password**: User's plain text password.
    """

    token_data = await service.authenticate_user(
        form_data.username, form_data.password
    )

    # Set the Refresh Token in the cookie
    set_refresh_cookie(response, token_data.refresh_token)

    # Remove refresh_token from body response for security/cleanliness
    token_data.refresh_token = None
    return token_data


@router.post(
    "/login/test-token",
    response_model=UserPublic,
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Token is invalid or expired"
        }
    },
)
async def test_token(current_user: CurrentUser) -> Any:
    """
    Verify Access Token validity.
    """
    return current_user


@router.post(
    "/refresh-token",
    response_model=TokenResponse,
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "description": "Refresh token missing, invalid or expired"
        },
        status.HTTP_400_BAD_REQUEST: {"description": "Bad Request"},
    },
)
async def refresh_token(
    response: Response,
    service: AuthServiceDep,
    refresh_token: Optional[str] = Cookie(None),
) -> Any:
    """
    Get a new Access Token using the Refresh Token cookie.

    Also performs **Token Rotation**:
    1. Validates the old refresh token.
    2. Issues a new Access Token.
    3. Issues a *new* Refresh Token and updates the cookie.
    4. Invalidates the old refresh token.
    """
    if not refresh_token:
        from app.auth.exceptions import NotAuthorized

        raise NotAuthorized("Refresh token missing")

    new_tokens = await service.refresh_token(refresh_token)

    set_refresh_cookie(response, new_tokens.refresh_token)

    new_tokens.refresh_token = None
    return new_tokens


@router.post(
    "/logout",
    response_model=Message,
    responses={status.HTTP_200_OK: {"description": "Successfully logged out"}},
)
async def logout(
    response: Response,
    request: Request,
    service: AuthServiceDep,
    refresh_token: Optional[str] = Cookie(None),
) -> Message:
    """
    Logout the user.
    """
    auth_header = request.headers.get("Authorization")
    access_token = None
    if auth_header and auth_header.startswith("Bearer "):
        access_token = auth_header.split(" ")[1]

    if access_token:
        await service.logout(access_token, refresh_token)

    response.delete_cookie("refresh_token")
    response.delete_cookie("access_token")

    return Message(message="Logged out successfully")


@router.post(
    "/password-reset/request",
    response_model=Message,
    status_code=status.HTTP_200_OK,
)
async def request_password_reset(
    body: PasswordResetRequest,
    service: AuthServiceDep,
    background_tasks: BackgroundTasks,
) -> Message:
    """
    Request a password reset link.

    Always returns 200 regardless of whether the email is registered.
    """
    email_data = await service.request_password_reset(body.email)
    if email_data:
        background_tasks.add_task(send_password_reset_email_task, email_data)
    return Message(message="If that email is registered, a reset link has been sent.")


@router.post(
    "/password-reset/confirm",
    response_model=Message,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Token is invalid or has expired"
        }
    },
)
async def confirm_password_reset(
    body: PasswordResetConfirm,
    service: AuthServiceDep,
) -> Message:
    """
    Reset password using the token from the reset email.
    """
    await service.reset_password(body.token, body.new_password)
    return Message(message="Password has been reset successfully.")
