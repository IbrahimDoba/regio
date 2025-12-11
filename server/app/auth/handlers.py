from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.auth.exceptions import NotAuthorized, PermissionDenied, BadAuthRequest


async def not_authorized_handler(request: Request, exc: NotAuthorized):
    """
    Catches 401 errors (InvalidCredentials, InvalidToken, etc).
    Also ensures the refresh token cookie is cleared if auth fails.
    """
    response = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": exc.detail},
        headers={"WWW-Authenticate": "Bearer"},
    )
    # If auth fails, ensure cookie is killed
    response.delete_cookie("refresh_token")
    return response


async def permission_denied_handler(request: Request, exc: PermissionDenied):
    """
    Catches 403 errors (AccountNotVerified, etc).
    """
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.detail},
        headers={"WWW-Authenticate": "Bearer"},
    )


async def bad_auth_request_handler(request: Request, exc: BadAuthRequest):
    """
    Catches 400 errors (AccountInactive, InvalidInviteCode, etc).
    """
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.detail},
        headers={"WWW-Authenticate": "Bearer"},
    )
