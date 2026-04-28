import mimetypes
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware

from app.admin.routes import router as admin_router
from app.auth.exceptions import BadAuthRequest, NotAuthorized, PermissionDenied
from app.auth.handlers import (
    bad_auth_request_handler,
    not_authorized_handler,
    permission_denied_handler,
)
from app.auth.routes import router as auth_router
from app.banking.enforcer import run_payment_enforcer
from app.banking.exceptions import (
    BankingBadRequest,
    BankingConflict,
    BankingForbidden,
    BankingNotFound,
)
from app.banking.fees import run_demurrage, run_monthly_fees
from app.banking.handlers import (
    banking_bad_request_handler,
    banking_conflict_handler,
    banking_forbidden_handler,
    banking_not_found_handler,
)
from app.banking.routes import router as banking_router
from app.broadcast.exceptions import BroadcastNotFound
from app.broadcast.handlers import broadcast_not_found_handler
from app.broadcast.routes import router as broadcast_router
from app.chat.routes import router as chat_router
from app.core.config import settings
from app.core.database import init_db, test_db_connection
from app.core.file_storage import StorageServiceDep
from app.core.handlers import global_exception_handler
from app.email.exceptions import EmailBaseException
from app.email.handlers import email_error_handler
from app.listings.exceptions import (
    InvalidListingData,
    ListingNotFound,
    ListingNotOwned,
)
from app.listings.handlers import (
    invalid_listing_data_handler,
    listing_not_found_handler,
    listing_permission_handler,
)
from app.listings.routes import router as listing_router
from app.users.exceptions import (
    AccessDenied,
    InvalidUserRequest,
    ResourceConflict,
    ResourceNotFound,
    SystemFailure,
)
from app.users.handlers import (
    access_denied_handler,
    invalid_user_request_handler,
    resource_conflict_handler,
    resource_not_found_handler,
    system_failure_handler,
)
from app.users.routes import router as user_router

scheduler = AsyncIOScheduler()
scheduler.add_job(
    run_payment_enforcer,
    trigger="interval",
    hours=1,
    id="payment_enforcer",
    replace_existing=True,
)
scheduler.add_job(
    run_monthly_fees,
    trigger="cron",
    day=1,
    hour=2,
    minute=0,
    id="monthly_fees",
    replace_existing=True,
)
scheduler.add_job(
    run_demurrage,
    trigger="cron",
    hour=5,
    minute=0,
    id="demurrage",
    replace_existing=True,
)


@asynccontextmanager
async def lifespan(_application: FastAPI) -> AsyncGenerator:
    # Startup
    await test_db_connection()
    await init_db()
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown(wait=False)


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    lifespan=lifespan,
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
    # openapi_external_docs=None if settings.ENVIRONMENT == 'production' else '/openapi.json',
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX or None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/healthcheck", include_in_schema=False)
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/media/{key:path}", include_in_schema=False)
async def serve_media(key: str, storage: StorageServiceDep) -> Response:
    """Proxy R2 object to the client — used for listing images."""
    data = await storage.get_bytes(key)
    if data is None:
        raise HTTPException(status_code=404, detail="Media not found")
    content_type, _ = mimetypes.guess_type(key)
    return Response(
        content=data, media_type=content_type or "application/octet-stream"
    )


# Include routers
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(user_router, prefix="/users", tags=["users"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(banking_router, prefix="/banking", tags=["banking"])
app.include_router(listing_router, prefix="/listings", tags=["listings"])
app.include_router(chat_router, prefix="/chats", tags=["chat"])
app.include_router(broadcast_router, prefix="/broadcasts", tags=["broadcasts"])

"""Register exception handlers"""

# Auth handlers
app.add_exception_handler(NotAuthorized, not_authorized_handler)  # type: ignore
app.add_exception_handler(PermissionDenied, permission_denied_handler)  # type: ignore
app.add_exception_handler(BadAuthRequest, bad_auth_request_handler)  # type: ignore

# User handlers
app.add_exception_handler(ResourceNotFound, resource_not_found_handler)  # type: ignore
app.add_exception_handler(ResourceConflict, resource_conflict_handler)  # type: ignore
app.add_exception_handler(InvalidUserRequest, invalid_user_request_handler)  # type: ignore
app.add_exception_handler(AccessDenied, access_denied_handler)  # type: ignore
app.add_exception_handler(SystemFailure, system_failure_handler)  # type: ignore

# Listing handlers
app.add_exception_handler(ListingNotFound, listing_not_found_handler)  # type: ignore
app.add_exception_handler(ListingNotOwned, listing_permission_handler)  # type: ignore
app.add_exception_handler(InvalidListingData, invalid_listing_data_handler)  # type: ignore

# Banking handlers
app.add_exception_handler(BankingNotFound, banking_not_found_handler)  # type: ignore
app.add_exception_handler(BankingBadRequest, banking_bad_request_handler)  # type: ignore
app.add_exception_handler(BankingForbidden, banking_forbidden_handler)  # type: ignore
app.add_exception_handler(BankingConflict, banking_conflict_handler)  # type: ignore

# Broadcast handlers
app.add_exception_handler(BroadcastNotFound, broadcast_not_found_handler)  # type: ignore

# Email handlers
app.add_exception_handler(EmailBaseException, email_error_handler)  # type: ignore

# Register the global catch-all last
app.add_exception_handler(Exception, global_exception_handler)
