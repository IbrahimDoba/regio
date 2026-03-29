import logging
from typing import List

from app.email.schemas import (
    BroadcastDigestEmailData,
    VerificationEmailData,
    VerificationStatusEmailData,
)
from app.email.service import email_service

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
    """Background task: send broadcast digest to multiple users."""
    for recipient in recipients:
        try:
            await email_service.send_broadcast_digest_email(recipient)
        except Exception as e:
            logger.error(
                f"Background broadcast digest failed for "
                f"{recipient.user_email}: {e}"
            )
