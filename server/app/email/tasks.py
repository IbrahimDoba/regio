import asyncio
import logging
from typing import List

from app.email.schemas import (
    BroadcastDigestEmailData,
    VerificationEmailData,
    VerificationStatusEmailData,
)
from app.email.service import email_service

_BROADCAST_SEMAPHORE = asyncio.Semaphore(10)

logger = logging.getLogger(__name__)


async def send_welcome_email_task(data: VerificationEmailData) -> None:
    """Background task: send welcome email after registration."""
    try:
        await email_service.send_welcome_email(data)
    except Exception as e:
        logger.error(
            f"Background welcome email failed for {data.user_email}: {e}"
        )


async def send_verification_status_email_task(
    data: VerificationStatusEmailData,
) -> None:
    """Background task: send verification status change email."""
    try:
        await email_service.send_verification_status_email(data)
    except Exception as e:
        logger.error(
            f"Background verification email failed for {data.user_email}: {e}"
        )


async def send_broadcast_digest_emails_task(
    recipients: List[BroadcastDigestEmailData],
) -> None:
    """Background task: send broadcast digest to multiple users concurrently."""
    async def _send_one(data: BroadcastDigestEmailData) -> None:
        async with _BROADCAST_SEMAPHORE:
            try:
                await email_service.send_broadcast_digest_email(data)
            except Exception as e:
                logger.error(
                    f"Background broadcast digest failed for "
                    f"{data.user_email}: {e}"
                )

    await asyncio.gather(*(_send_one(r) for r in recipients))
