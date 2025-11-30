import sys
import logging
from typing import Annotated
from collections.abc import AsyncGenerator

from fastapi import Depends

from sqlmodel import select
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession, create_async_engine

from app.core.config import settings
from app.auth.security import get_password_hash
from app.users.config import user_settings
from app.users.enums import TrustLevel
from app.users.models import User
from app.users.service import UserService

# Use an async engine
DATABASE_URL = str(settings.DATABASE_URL)
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
)

# AsyncSession maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# make sure all SQLModel models are imported (app.users.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly

async def test_db_connection() -> None:
    """
    Tests the database connection by attempting to connect and logging the result.
    Exits the application if the connection fails.
    """
    logger.info("Establishing database connection...")
    try:
        async with engine.connect() as connection:
            await connection.execute(select(1))
            logger.info("✅ Database connection established.")
    except OperationalError as e:
        logger.error(
            f"❌ **FATAL ERROR:** Failed to connect to the database at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}."
        )
        logger.error(f"Reason: {e}")
        sys.exit(1)
    except SQLAlchemyError as e:
        logger.error(f"❌ An unexpected SQLAlchemy error occurred during connection test: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ An unexpected error occurred during database connection test: {e}")
        sys.exit(1)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency generator for AsyncSession.
    """
    async with AsyncSessionLocal() as session:
        yield session

# GLOBAL DEPENDENCY 
SessionDep = Annotated[AsyncSession, Depends(get_db)]


async def init_db() -> None:
    # NOTE: Tables should be created with Alembic migrations
    logger.info("Initialising database")
    async with AsyncSessionLocal() as session:
        service = UserService(session)

        # Check if sink user exists
        user = await service.get_user_by_email(user_settings.SYSTEM_SINK_EMAIL)

        if not user:
            logger.info("Creating System Sink User...")
            try:
                db_user = User(
                    user_code=user_settings.SYSTEM_SINK_CODE,
                    email=user_settings.SYSTEM_SINK_EMAIL,
                    password_hash=get_password_hash(user_settings.SYSTEM_SINK_PASSWORD),
                    first_name=user_settings.SYSTEM_SINK_FIRST_NAME,
                    last_name=user_settings.SYSTEM_SINK_LAST_NAME,
                    address="SYSTEM",
                    invite_code="SYSTEM", # Bypass invite check for system init
                    is_verified=True,
                    is_active=True,
                    is_system_admin=True,
                    trust_level=TrustLevel.T6
                )
                session.add(db_user)
                await session.commit()
                logger.info("Created System Sink User Successfully")
            except Exception as e:
                logger.error(f"Failed to init system user: {e}")
