"""
AES-256-CBC encryption utilities for Matrix credentials.

Uses a static IV to match the reference Node.js implementation.
The key is the MATRIX_ENCRYPTION_KEY (exactly 32 bytes, padded if shorter).
"""

import base64
import os

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7

# Static IV to match reference implementation (16 null bytes)
_STATIC_IV = b"\x00" * 16


def _get_key() -> bytes:
    from app.core.config import settings

    raw = settings.MATRIX_ENCRYPTION_KEY
    # Try base64url / standard base64 decode first (e.g. 44-char base64 → 32 bytes)
    try:
        key = base64.urlsafe_b64decode(raw + "==")  # pad just in case
        if len(key) >= 32:
            return key[:32]
    except Exception:
        pass
    # Fallback: treat as raw UTF-8, pad/truncate to 32 bytes
    key_bytes = raw.encode("utf-8")
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b"\x00")
    return key_bytes[:32]


def generate_secure_password() -> str:
    """Generate a 64-char hex password (32 random bytes)."""
    return os.urandom(32).hex()


def encrypt_password(plain: str) -> str:
    """Encrypt a password using AES-256-CBC with a static IV. Returns base64 string."""
    key = _get_key()
    padder = PKCS7(128).padder()
    data = plain.encode("utf-8")
    padded = padder.update(data) + padder.finalize()

    cipher = Cipher(algorithms.AES(key), modes.CBC(_STATIC_IV))
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(padded) + encryptor.finalize()

    return base64.b64encode(encrypted).decode("utf-8")


def decrypt_password(encrypted: str) -> str:
    """Decrypt an AES-256-CBC encrypted base64 string. Returns plaintext."""
    key = _get_key()
    data = base64.b64decode(encrypted)

    cipher = Cipher(algorithms.AES(key), modes.CBC(_STATIC_IV))
    decryptor = cipher.decryptor()
    padded = decryptor.update(data) + decryptor.finalize()

    unpadder = PKCS7(128).unpadder()
    plain = unpadder.update(padded) + unpadder.finalize()

    return plain.decode("utf-8")
