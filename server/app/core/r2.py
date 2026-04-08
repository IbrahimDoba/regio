import asyncio
import tempfile
import uuid
from pathlib import Path
from typing import Annotated, AsyncGenerator

import aioboto3
from aiobotocore.client import AioBaseClient
from botocore.exceptions import ClientError
from fastapi import Depends, UploadFile

from app.core.config import settings
from app.core.exceptions import FileUploadError

# Cap concurrent GhostScript processes to avoid resource exhaustion under load
_GS_SEMAPHORE = asyncio.Semaphore(4)

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

    async def _compress(self, data: bytes, content_type: str) -> bytes:
        """
        Compress raw bytes using GhostScript and return the compressed result.

        PDFs are compressed with pdfwrite (all pages preserved).
        Images are converted to a compressed JPEG.

        Uses temp files internally. Falls back to original bytes on any failure.
        """
        suffix = ".pdf" if content_type == "application/pdf" else ".img"

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as src_f:
            src_path = Path(src_f.name)
            src_f.write(data)

        if content_type == "application/pdf":
            dst_path = src_path.with_suffix(".out.pdf")
            cmd = [
                "gs",
                "-dBATCH",
                "-dNOPAUSE",
                "-dQUIET",
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                "-dPDFSETTINGS=/ebook",
                f"-sOutputFile={dst_path}",
                str(src_path),
            ]
        else:
            dst_path = src_path.with_suffix(".out.jpg")
            cmd = [
                "gs",
                "-dBATCH",
                "-dNOPAUSE",
                "-dQUIET",
                "-sDEVICE=jpeg",
                "-dJPEGQ=75",
                "-r150",
                f"-sOutputFile={dst_path}",
                str(src_path),
            ]

        try:
            async with _GS_SEMAPHORE:
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.DEVNULL,
                )
                await proc.wait()

            if proc.returncode == 0 and dst_path.exists():
                return dst_path.read_bytes()
            return data  # fallback: keep original
        except Exception:
            return data  # fallback: keep original
        finally:
            src_path.unlink(missing_ok=True)
            dst_path.unlink(missing_ok=True)

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
        content_type = file.content_type or "application/octet-stream"
        raw = await file.read()
        compressed = await self._compress(raw, content_type)

        # GhostScript always outputs JPEG for non-PDF files
        if content_type not in ("application/pdf", "application/octet-stream"):
            content_type = "image/jpeg"

        try:
            await self.client.put_object(  # type: ignore
                Bucket=self.bucket,
                Key=key,
                Body=compressed,
                ContentType=content_type,
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
