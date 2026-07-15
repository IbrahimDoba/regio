import asyncio
import logging
from typing import List

from sqlmodel import select

from app.core.database import AsyncSessionLocal
from app.email.config import email_settings
from app.email.schemas import (
    AdminNewUserEmailData,
    BookingReminderEmailData,
    BroadcastDigestEmailData,
    DisputeResolvedEmailData,
    EmailChangeConfirmData,
    EmailChangeNotifyData,
    PasswordResetEmailData,
    PaymentRequestRejectedEmailData,
    VerificationEmailData,
    VerificationStatusEmailData,
)
from app.email.service import email_service
from app.users.enums import VerificationStatus
from app.users.models import User

logger = logging.getLogger(__name__)


async def send_welcome_email_task(data: VerificationEmailData) -> None:
    """Background task: send welcome email after registration."""
    try:
        await email_service.send_welcome_email(data)
    except Exception as e:
        logger.exception(
            f"Background welcome email failed for {data.user_email}: {e}"
        )


async def send_admin_new_user_email_task(data: AdminNewUserEmailData) -> None:
    """Background task: notify the system admin of a new registration."""
    try:
        await email_service.send_admin_new_user_email(data)
    except Exception as e:
        logger.exception(
            f"Background admin new-user email failed for {data.new_user_email}: {e}"
        )


BOOKING_REMINDER_DELAY_SECONDS = 30 * 60  # 30 minutes


async def send_booking_reminder_email_task(
    data: BookingReminderEmailData,
) -> None:
    """Background task: send booking reminder 30 minutes after registration.

    When the delay elapses we re-check the user's verification status and
    skip the reminder unless they are still PENDING — so users who already
    completed (or were otherwise progressed past) the call aren't nudged.
    A proper task-queue solution (Celery + Redis) would allow cancellation,
    but re-checking status on wake is sufficient for the current architecture.
    """
    await asyncio.sleep(BOOKING_REMINDER_DELAY_SECONDS)
    try:
        async with AsyncSessionLocal() as session:
            status = await session.scalar(
                select(User.verification_status).where(
                    User.email == data.user_email
                )
            )
        if status != VerificationStatus.PENDING:
            logger.info(
                "Skipping booking reminder for %s (status=%s)",
                data.user_email,
                status,
            )
            return
        await email_service.send_booking_reminder_email(data)
    except Exception as e:
        logger.exception(
            f"Background booking reminder failed for {data.user_email}: {e}"
        )


async def send_verification_status_email_task(
    data: VerificationStatusEmailData,
) -> None:
    """Background task: send verification status change email."""
    try:
        await email_service.send_verification_status_email(data)
    except Exception as e:
        logger.exception(
            f"Background verification email failed for {data.user_email}: {e}"
        )


async def send_payment_request_rejected_email_task(
    data: PaymentRequestRejectedEmailData,
) -> None:
    """Background task: notify creditor their payment request was rejected."""
    try:
        await email_service.send_payment_request_rejected_email(data)
    except Exception as e:
        logger.exception(
            f"Background rejection email failed for {data.user_email}: {e}"
        )


async def send_dispute_resolved_email_task(
    data: DisputeResolvedEmailData,
) -> None:
    """Background task: notify a user of a dispute resolution outcome."""
    try:
        await email_service.send_dispute_resolved_email(data)
    except Exception as e:
        logger.exception(
            f"Background dispute resolved email failed for {data.user_email}: {e}"
        )


async def send_password_reset_email_task(data: PasswordResetEmailData) -> None:
    """Background task: send password reset email."""
    try:
        await email_service.send_password_reset_email(data)
    except Exception as e:
        logger.exception(
            f"Background password reset email failed for {data.user_email}: {e}"
        )


async def send_broadcast_digest_emails_task(
    recipients: List[BroadcastDigestEmailData],
) -> None:
    """
    Send broadcast digest to many users without bursting the SMTP relay.

    Recipients are processed in fixed-size chunks. Within each chunk a small
    number of sends run concurrently; between chunks we sleep so the upstream
    SMTP relay observes a steady, paced flow rather than a thousand near-
    simultaneous TLS handshakes.
    """
    if not recipients:
        return

    chunk_size = email_settings.BROADCAST_CHUNK_SIZE
    chunk_delay = email_settings.BROADCAST_CHUNK_DELAY_SECONDS
    semaphore = asyncio.Semaphore(email_settings.BROADCAST_CONCURRENCY)

    async def _send_one(data: BroadcastDigestEmailData) -> None:
        async with semaphore:
            try:
                await email_service.send_broadcast_digest_email(data)
            except Exception as e:
                logger.exception(
                    f"Background broadcast digest failed for "
                    f"{data.user_email}: {e}"
                )

    total = len(recipients)
    logger.info(
        "Broadcast digest: %d recipients, chunk_size=%d, concurrency=%d",
        total,
        chunk_size,
        email_settings.BROADCAST_CONCURRENCY,
    )

    for start in range(0, total, chunk_size):
        chunk = recipients[start : start + chunk_size]
        await asyncio.gather(*(_send_one(r) for r in chunk))
        end = start + len(chunk)
        if end < total:
            logger.debug(
                "Broadcast digest paused after %d/%d for %.1fs",
                end,
                total,
                chunk_delay,
            )
            await asyncio.sleep(chunk_delay)


async def send_email_change_notify_task(data: EmailChangeNotifyData) -> None:
    """Background task: notify old address that an email change was requested."""
    try:
        await email_service.send_email_change_notify_email(data)
    except Exception as e:
        logger.exception(
            f"Background email-change notify failed for {data.user_email}: {e}"
        )


async def send_email_change_confirm_task(data: EmailChangeConfirmData) -> None:
    """Background task: send confirmation link to new address."""
    try:
        await email_service.send_email_change_confirm_email(data)
    except Exception as e:
        logger.exception(
            f"Background email-change confirm failed for {data.user_email}: {e}"
        )
