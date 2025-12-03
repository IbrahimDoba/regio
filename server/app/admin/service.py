from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.models import User
from app.banking.models import Account, PaymentRequest
from app.banking.enums import Currency, PaymentStatus
from app.admin.schemas import SystemStats

class AdminService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_system_stats(self) -> SystemStats:
        """
        Aggregates high-level metrics for the Admin Dashboard.
        """
        # User Stats
        total_users = await self.session.execute(select(func.count(User.id)))
        active_users = await self.session.execute(select(func.count(User.id)).where(User.is_active == True))
        
        # Financial Stats (Sum of all positive balances)
        # Note: In a zero-sum system, Net Balance is 0, but "Volume" or "Assets" is what we want.
        total_time = await self.session.execute(
            select(func.sum(Account.balance_time)).where(Account.type == Currency.TIME, Account.balance_time > 0)
        )
        total_regio = await self.session.execute(
            select(func.sum(Account.balance_regio)).where(Account.type == Currency.REGIO, Account.balance_regio > 0)
        )
        
        # Pending Disputes/Requests
        pending = await self.session.execute(
            select(func.count(PaymentRequest.id)).where(PaymentRequest.status == PaymentStatus.PENDING)
        )

        return SystemStats(
            total_users=total_users.one() or 0,
            active_users=active_users.one() or 0,
            total_time_volume=total_time.one() or 0,
            total_regio_volume=total_regio.one() or 0,
            pending_disputes=pending.one() or 0
        )

    async def get_pending_disputes(self):
        """
        Fetches all PENDING payment requests for review.
        """
        # In a real app, join with User to get names/codes eagerly
        statement = select(PaymentRequest).where(PaymentRequest.status == PaymentStatus.PENDING)
        results = await self.session.execute(statement)
        return results.all()
