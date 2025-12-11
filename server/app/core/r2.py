from typing import Annotated, AsyncGenerator

from fastapi import Depends

import aioboto3
from aiobotocore.client import AioBaseClient
from app.core.config import settings


# This session holds the configuration and can be reused
session = aioboto3.Session(
    aws_access_key_id=settings.R2_ACCESS_KEY_ID,
    aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
)


async def fetch_s3_object(key: str) -> bytes | None:
    async with session.client("s3", endpoint_url=settings.R2_ENDPOINT_URL) as s3_client:
        """Helper to safely download a file and return bytes."""
        try:
            obj = await s3_client.get_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
            async with obj["Body"] as stream:
                return await stream.read()
        except Exception:
            # Log and return None, just like the old code skipped missing files
            # logger.warning(f"Could not fetch S3 object {key}: {e}")
            return None


# S3 client dependency function, similar to SessionDep
async def get_s3_client() -> AsyncGenerator[AioBaseClient, None]:
    """
    Dependency generator for the S3 client.

    This is used in the endpoints to get a client,
    and is automatically closed after usage.
    """
    # Use 'aioboto3.Session' to create a client
    async with session.client("s3", endpoint_url=settings.R2_ENDPOINT_URL) as s3_client:
        yield s3_client


S3ClientDep = Annotated[AioBaseClient, Depends(get_s3_client)]
