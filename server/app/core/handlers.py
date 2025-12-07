import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse

# Setup a logger (or import your configured logger)
logger = logging.getLogger("uvicorn.error")

async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler for unhandled exceptions (500 Internal Server Errors).
    
    1. Logs the full stack trace securely on the server.
    2. Returns a clean, generic JSON response to the client.
    """
    # Log the error details so you can debug it later
    # (In production, this goes to Sentry/Datadog/CloudWatch)
    logger.error(f"Global Exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred. Please contact support."
        },
    )
