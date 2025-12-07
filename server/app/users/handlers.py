from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.users.exceptions import (
    ResourceNotFound,
    ResourceConflict,
    InvalidUserRequest,
    AccessDenied,
    SystemFailure
)

async def resource_not_found_handler(request: Request, exc: ResourceNotFound):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )

async def resource_conflict_handler(request: Request, exc: ResourceConflict):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.detail},
    )

async def invalid_user_request_handler(request: Request, exc: InvalidUserRequest):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.detail},
    )

async def access_denied_handler(request: Request, exc: AccessDenied):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.detail},
    )

async def system_failure_handler(request: Request, exc: SystemFailure):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": exc.detail},
    )
