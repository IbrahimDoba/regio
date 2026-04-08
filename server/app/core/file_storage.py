import asyncio
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import Depends, UploadFile

from app.core.exceptions import FileUploadError

# Resolves to <server_root>/data/
BASE_DIR = Path(__file__).resolve().parents[2] / "data"


class LocalStorageService:
    """Service for handling local filesystem storage operations."""

    def __init__(self, base_dir: Path = BASE_DIR):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def _compress(self, path: Path, content_type: str) -> Path:
        """
        Compress a file using GhostScript.

        PDFs are compressed in-place with pdfwrite (preserves all pages).
        Images are converted to a compressed JPEG.

        Returns the final path on disk, which may differ from the input path
        if an image was converted to JPEG.
        """
        if content_type == "application/pdf":
            tmp = path.with_suffix(".gs_tmp.pdf")
            cmd = [
                "gs", "-dBATCH", "-dNOPAUSE", "-dQUIET",
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                "-dPDFSETTINGS=/ebook",
                f"-sOutputFile={tmp}",
                str(path),
            ]
            final_path = path  # stays .pdf, overwritten in-place
        else:
            # All images → compressed JPEG
            tmp = path.with_suffix(".gs_tmp.jpg")
            cmd = [
                "gs", "-dBATCH", "-dNOPAUSE", "-dQUIET",
                "-sDEVICE=jpeg",
                "-dJPEGQ=75",
                "-r150",
                f"-sOutputFile={tmp}",
                str(path),
            ]
            final_path = path.with_suffix(".jpg")

        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await proc.wait()

            if proc.returncode == 0 and tmp.exists():
                if content_type == "application/pdf":
                    tmp.replace(path)
                else:
                    tmp.replace(final_path)
                    if path != final_path:
                        path.unlink(missing_ok=True)
                return final_path
            else:
                tmp.unlink(missing_ok=True)
                return path  # fallback: keep original untouched
        except Exception:
            if tmp.exists():
                tmp.unlink(missing_ok=True)
            return path  # fallback: keep original untouched

    async def upload(
        self, file: UploadFile, folder: str, filename: str | None = None
    ) -> str:
        """
        Save a file to local storage and return the object key.

        The file is compressed via GhostScript before being stored.
        If compression fails, the original bytes are kept.

        Args:
            file: The FastAPI UploadFile object.
            folder: Logical folder path (e.g. 'listings/{listing_id}').
            filename: Optional custom name. If None, generates a UUID-based name.

        Returns:
            The object key (e.g. 'listings/abc123/uuid.jpg').
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
        dest_dir = self.base_dir / clean_folder
        dest_dir.mkdir(parents=True, exist_ok=True)

        dest_path = dest_dir / final_name
        await file.seek(0)

        try:
            dest_path.write_bytes(await file.read())
        except Exception as e:
            raise FileUploadError(str(e))

        final_path = await self._compress(
            dest_path, file.content_type or "application/octet-stream"
        )

        return f"{clean_folder}/{final_path.name}"

    async def get_bytes(self, key: str | None) -> bytes | None:
        """Read a file from local storage and return raw bytes. Returns None if not found."""
        if not key:
            return None

        path = self.base_dir / key
        if not path.exists():
            return None

        try:
            return path.read_bytes()
        except Exception as e:
            raise FileUploadError(str(e))

    async def delete(self, key: str) -> bool:
        """Delete a file from local storage. Returns True on success, False on failure."""
        if not key:
            return False

        try:
            (self.base_dir / key).unlink(missing_ok=True)
            return True
        except Exception:
            return False


# --- Dependency Injection ---


def get_storage_service() -> LocalStorageService:
    """FastAPI dependency that returns a LocalStorageService instance."""
    return LocalStorageService()


StorageServiceDep = Annotated[LocalStorageService, Depends(get_storage_service)]
