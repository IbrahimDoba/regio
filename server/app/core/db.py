import sys
import logging
from sqlmodel import select

from sqlmodel import select
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession, create_async_engine

from app.enums import TrustLevel
from app.crud import users_crud
from app.core.config import settings
from app.models.users import User, UserCreate

# Use an async engine
DATABASE_URL = str(settings.SQLALCHEMY_DATABASE_URI)
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
)

# AsyncSession maker
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly

async def test_db_connection() -> None:
    """
    Tests the database connection by attempting to connect and logging the result.
    Exits the application if the connection fails.
    """
    logger.info("Establishing database connection...")
    try:
        # Use an asynchronous connection context manager to test the connection
        async with engine.connect() as connection:
            # Optionally execute a lightweight query to ensure the connection is truly open
            # This is often implicit upon successful connection, but a simple SELECT 1 is robust.
            await connection.execute(select(1))
            logger.info("✅ Database connection established.")
    except OperationalError as e:
        logger.error(
            f"❌ **FATAL ERROR:** Failed to connect to the database at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}."
        )
        logger.error(f"Reason: {e}")
        # Terminate the application if the database connection fails
        # This prevents the application from starting without a critical dependency.
        sys.exit(1) # Exit with an error code
    except SQLAlchemyError as e:
        logger.error(f"❌ An unexpected SQLAlchemy error occurred during connection test: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ An unexpected error occurred during database connection test: {e}")
        # sys.exit(1)


async def init_db() -> None:
    # NOTE: Tables should be created with Alembic migrations
    logger.info("Initialising database")
    async with AsyncSessionLocal() as session:
        results = await session.execute(
            select(User).where(User.email == settings.SUPERUSER_EMAIL)
        )
        user = results.scalars().first()
        if not user:
            user_in = UserCreate(
                user_code=settings.SUPERUSER_CODE,
                first_name=settings.SUPERUSER_FIRST_NAME,
                last_name=settings.SUPERUSER_LAST_NAME,
                email=settings.SUPERUSER_EMAIL,
                is_active=True,
                password=settings.SUPERUSER_PASSWORD,
                is_system_admin=True,
                trust_level=TrustLevel.T5
            )
            await users_crud.create_user(session=session, user_create=user_in)
