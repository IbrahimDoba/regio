import logging

from app.banking.service import BankingService
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def run_monthly_fees() -> None:
    """
    Monthly job: collect 30-minute membership fee from every active user
    and transfer it to the system sink account.
    """
    logger.info("Monthly fees: starting run")
    async with AsyncSessionLocal() as session:
        service = BankingService(session)
        try:
            results = await service.collect_monthly_fees()
        except Exception as e:
            logger.error(f"Monthly fees: aborted — {e}")
            return

    succeeded = sum(1 for r in results if r["status"] == "SUCCESS")
    failed = [r for r in results if r["status"] == "FAILED"]
    if failed:
        logger.error(
            f"Monthly fees: {len(failed)} collection(s) failed — "
            + ", ".join(r["user"] for r in failed)
        )
    logger.info(
        f"Monthly fees: done — {succeeded} collected, {len(failed)} failed"
    )


async def run_demurrage() -> None:
    """
    Daily job: apply the 6% annual demurrage tax to TIME balances above
    the 1,800-minute threshold and transfer the deducted minutes to the
    system sink account.
    """
    logger.info("Demurrage: starting run")
    async with AsyncSessionLocal() as session:
        service = BankingService(session)
        try:
            result = await service.process_demurrage()
        except Exception as e:
            logger.error(f"Demurrage: aborted — {e}")
            return

    logger.info(
        f"Demurrage: done — {result['processed_users']} user(s), "
        f"{result['total_minutes_collected']} minutes collected"
    )
