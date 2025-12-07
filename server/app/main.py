from typing import AsyncGenerator

from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, test_db_connection
from app.core.handlers import global_exception_handler

from app.users.routes import router as user_router
from app.auth.routes import router as auth_router
from app.banking.routes import router as banking_router
from app.listings.routes import router as listing_router
from app.admin.routes import router as admin_router

from app.auth.exceptions import NotAuthorized, PermissionDenied, BadAuthRequest
from app.auth.handlers import (
    not_authorized_handler,
    permission_denied_handler,
    bad_auth_request_handler
)

from app.users.exceptions import (
    ResourceNotFound, 
    ResourceConflict, 
    InvalidUserRequest,
    AccessDenied,
    SystemFailure
)
from app.users.handlers import (
    resource_not_found_handler, 
    resource_conflict_handler,
    invalid_user_request_handler,
    access_denied_handler,
    system_failure_handler
)

from app.listings.exceptions import ListingNotFound, ListingNotOwned, InvalidListingData
from app.listings.handlers import (
    listing_not_found_handler, 
    listing_permission_handler, 
    invalid_listing_data_handler
)

from app.banking.exceptions import (
    BankingNotFound,
    BankingBadRequest,
    BankingForbidden,
    BankingConflict
)
from app.banking.handlers import (
    banking_not_found_handler,
    banking_bad_request_handler,
    banking_forbidden_handler,
    banking_conflict_handler
)


@asynccontextmanager
async def lifespan(_application: FastAPI) -> AsyncGenerator:
    # Startup
    await test_db_connection()
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    lifespan=lifespan,
    docs_url=None if settings.ENVIRONMENT == 'production' else '/docs',
    redoc_url=None if settings.ENVIRONMENT == 'production' else '/redoc',
    # openapi_external_docs=None if settings.ENVIRONMENT == 'production' else '/openapi.json',
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        # allow_origins=settings.all_cors_origins,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/healthcheck", include_in_schema=False)
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

# Include routers
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(user_router, prefix="/users", tags=["users"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(banking_router, prefix="/banking", tags=["banking"])
app.include_router(listing_router, prefix="/listings", tags=["listings"])

"""Register exception handlers"""

# Auth handlers
app.add_exception_handler(NotAuthorized, not_authorized_handler)
app.add_exception_handler(PermissionDenied, permission_denied_handler)
app.add_exception_handler(BadAuthRequest, bad_auth_request_handler)

# User handlers
app.add_exception_handler(ResourceNotFound, resource_not_found_handler)
app.add_exception_handler(ResourceConflict, resource_conflict_handler)
app.add_exception_handler(InvalidUserRequest, invalid_user_request_handler)
app.add_exception_handler(AccessDenied, access_denied_handler)
app.add_exception_handler(SystemFailure, system_failure_handler)

# Listing handlers
app.add_exception_handler(ListingNotFound, listing_not_found_handler)
app.add_exception_handler(ListingNotOwned, listing_permission_handler)
app.add_exception_handler(InvalidListingData, invalid_listing_data_handler)

# Banking handlers
app.add_exception_handler(BankingNotFound, banking_not_found_handler)
app.add_exception_handler(BankingBadRequest, banking_bad_request_handler)
app.add_exception_handler(BankingForbidden, banking_forbidden_handler)
app.add_exception_handler(BankingConflict, banking_conflict_handler)

# Register the global catch-all last
app.add_exception_handler(Exception, global_exception_handler)
