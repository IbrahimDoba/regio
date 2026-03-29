import uuid
from typing import Annotated, AsyncGenerator

import aioboto3
from aiobotocore.client import AioBaseClient
from botocore.exceptions import ClientError
from fastapi import Depends, UploadFile

from app.core.config import settings
from app.core.exceptions import FileUploadError

# Global session — reused across requests for connection pooling
session = aioboto3.Session(
    aws_access_key_id=settings.R2_ACCESS_KEY_ID,
    aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
)


class StorageService:
    """Service for handling S3/R2 object storage operations."""

    def __init__(self, client: AioBaseClient):
        self.client = client
        self.bucket = settings.R2_BUCKET_NAME

    async def upload(
        self, file: UploadFile, folder: str, filename: str | None = None
    ) -> str:
        """
        Upload a file to R2 and return the object key.

        Args:
            file: The FastAPI UploadFile object.
            folder: Logical folder path (e.g. 'listings/{listing_id}').
            filename: Optional custom name. If None, generates a UUID-based name.

        Returns:
            The full object key (e.g. 'listings/abc123/uuid.jpg').
        """
        if filename:
            final_name = filename
        else:
            ext = (
                file.filename.split(".")[-1]
                if file.filename and "." in file.filename
                else "bin"
            )
            final_name = f"{uuid.uuid4()}.{ext}"

        clean_folder = folder.strip("/")
        key = f"{clean_folder}/{final_name}"

        await file.seek(0)

        try:
            await self.client.put_object(  # type: ignore
                Bucket=self.bucket,
                Key=key,
                Body=file.file,
                ContentType=file.content_type or "application/octet-stream",
            )
        except ClientError as e:
            raise FileUploadError(str(e))

        return key

    async def get_bytes(self, key: str | None) -> bytes | None:
        """Fetch a file from R2 and return raw bytes. Returns None if not found."""
        if not key:
            return None

        try:
            response = await self.client.get_object(  # type: ignore
                Bucket=self.bucket, Key=key
            )
            async with response["Body"] as stream:
                return await stream.read()
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return None
            raise FileUploadError(str(e))

    async def delete(self, key: str) -> bool:
        """Delete a file from R2. Returns True on success, False on failure."""
        if not key:
            return False

        try:
            await self.client.delete_object(Bucket=self.bucket, Key=key)  # type: ignore
            return True
        except Exception:
            return False


# --- Dependency Injection ---


async def get_storage_service() -> AsyncGenerator[StorageService, None]:
    """FastAPI dependency that yields a StorageService with an active S3 client."""
    async with session.client(  # type: ignore
        "s3", endpoint_url=settings.R2_ENDPOINT_URL
    ) as client:
        yield StorageService(client)


StorageServiceDep = Annotated[StorageService, Depends(get_storage_service)]
