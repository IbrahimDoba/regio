import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.banking.enums import PaymentStatus
from app.banking.models import PaymentRequest
from app.banking.service import BankingService
from app.core.database import AsyncSessionLocal
from app.email.schemas import (
    PaymentEnforcedEmailData,
    PaymentReminderEmailData,
)
from app.email.service import email_service

logger = logging.getLogger(__name__)

REMINDER_AFTER_DAYS = 5
ENFORCE_AFTER_DAYS = 7


async def run_payment_enforcer() -> None:
    """
    Hourly job that enforces the 5+2 day payment rule.

    - Day 5–6: send reminder email to debtor (once).
    - Day 7+: force-execute the payment if no dispute has been raised.
    """
    logger.info("Payment enforcer: starting run")
    now = datetime.now(timezone.utc)
    five_days_ago = now - timedelta(days=REMINDER_AFTER_DAYS)
    seven_days_ago = now - timedelta(days=ENFORCE_AFTER_DAYS)

    async with AsyncSessionLocal() as session:
        service = BankingService(session)

        # ------------------------------------------------------------------ #
        # REMINDERS — overdue by 5–6 days, not yet reminded, not disputed
        # ------------------------------------------------------------------ #
        reminder_stmt = (
            select(PaymentRequest)
            .where(
                PaymentRequest.status == PaymentStatus.PENDING,
                PaymentRequest.created_at < five_days_ago,
                PaymentRequest.created_at
                >= seven_days_ago,  # not yet in enforce window
                PaymentRequest.reminder_sent_at.is_(None),
                PaymentRequest.dispute_raised.is_(False),
            )
            .options(
                selectinload(PaymentRequest.creditor),
                selectinload(PaymentRequest.debtor),
            )
        )
        reminder_requests = (
            (await session.execute(reminder_stmt)).scalars().all()
        )

        reminded = 0
        for req in reminder_requests:
            try:
                days_pending = (
                    now - req.created_at.astimezone(timezone.utc)
                ).days
                await email_service.send_payment_reminder_email(
                    PaymentReminderEmailData(
                        user_first_name=req.debtor.first_name,
                        user_email=req.debtor.email,
                        creditor_name=req.creditor.full_name,
                        amount_time=req.amount_time,
                        amount_regio=float(req.amount_regio),
                        description=req.description,
                        days_pending=days_pending,
                    )
                )
                req.reminder_sent_at = now
                session.add(req)
                await (
                    session.commit()
                )  # commit per-request so a crash mid-loop
                reminded += 1  # doesn't cause duplicate reminder emails
                logger.info(f"Enforcer: reminder sent for request {req.id}")
            except Exception as e:
                await session.rollback()
                logger.error(
                    f"Enforcer: reminder failed for request {req.id}: {e}"
                )

        # ------------------------------------------------------------------ #
        # FORCE EXECUTE — overdue by 7+ days, not disputed
        # ------------------------------------------------------------------ #
        enforce_stmt = (
            select(PaymentRequest)
            .where(
                PaymentRequest.status == PaymentStatus.PENDING,
                PaymentRequest.created_at < seven_days_ago,
                PaymentRequest.dispute_raised.is_(False),
            )
            .options(
                selectinload(PaymentRequest.creditor),
                selectinload(PaymentRequest.debtor),
            )
        )
        enforce_requests = (
            (await session.execute(enforce_stmt)).scalars().all()
        )

        executed = 0
        for req in enforce_requests:
            # Snapshot user info before processing — session state may change
            creditor_name = req.creditor.full_name
            creditor_email = req.creditor.email
            creditor_first_name = req.creditor.first_name
            debtor_name = req.debtor.full_name
            debtor_email = req.debtor.email
            debtor_first_name = req.debtor.first_name
            amount_time = req.amount_time
            amount_regio = float(req.amount_regio)
            description = req.description

            try:
                await service.force_execute_payment_request(req.id)
                executed += 1
                logger.info(f"Enforcer: force-executed request {req.id}")

                # Notify both parties
                for is_creditor, first_name, email, other_name in [
                    (True, creditor_first_name, creditor_email, debtor_name),
                    (False, debtor_first_name, debtor_email, creditor_name),
                ]:
                    try:
                        await email_service.send_payment_enforced_email(
                            PaymentEnforcedEmailData(
                                user_first_name=first_name,
                                user_email=email,
                                is_creditor=is_creditor,
                                other_party_name=other_name,
                                amount_time=amount_time,
                                amount_regio=amount_regio,
                                description=description,
                            )
                        )
                    except Exception as e:
                        logger.error(
                            f"Enforcer: notification failed for request {req.id} "
                            f"({'creditor' if is_creditor else 'debtor'}): {e}"
                        )
            except Exception as e:
                await session.rollback()
                logger.error(
                    f"Enforcer: force-execute failed for request {req.id}: {e}"
                )

    logger.info(
        f"Payment enforcer: done — {reminded} reminder(s), {executed} executed"
    )
