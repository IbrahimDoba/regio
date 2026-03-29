from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.email.exceptions import EmailBaseException


async def email_error_handler(
    request: Request, exc: EmailBaseException
) -> JSONResponse:
    """Map email exceptions to a 502 Bad Gateway response."""
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"detail": exc.detail},
    )
