import logging

from fastapi import FastAPI
from fastapi.routing import APIRoute
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware

from app.core.db import init_db, test_db_connection
from app.core.config import settings
from app.api.main import api_router


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await test_db_connection()
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    lifespan=lifespan,
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

# Include routers
app.include_router(api_router)
