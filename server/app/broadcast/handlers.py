from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.broadcast.exceptions import BroadcastNotFound


async def broadcast_not_found_handler(
    request: Request, exc: BroadcastNotFound
):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )
