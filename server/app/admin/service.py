from typing import List
import uuid
from decimal import Decimal

from sqlmodel import select, func, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.users.models import User
from app.users.enums import VerificationStatus
from app.banking.models import Account, PaymentRequest
from app.banking.enums import Currency, PaymentStatus
from app.listings.models import Tag, Listing
from app.listings.enums import ListingStatus
from app.listings.exceptions import TagNotFound
from app.admin.schemas import (
    SystemStats,
    UserAdminView,
    UserListResponse,
    TagAdminUpdate,
    BroadcastCreate,
    DisputePublic,
    TagAdminView,
)


class AdminService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # DASHBOARD
    async def get_system_stats(self) -> SystemStats:
        """
        Aggregates high-level metrics for the Admin Dashboard.
        """
        total_users = await self.session.execute(select(func.count(User.id)))
        active_users = await self.session.execute(
            select(func.count(User.id)).where(User.is_active)
        )
        verification_pending_users = await self.session.execute(
            select(func.count(User.id)).where(
                User.verification_status == VerificationStatus.PENDING
            )
        )

        total_time = await self.session.execute(
            select(func.sum(Account.balance_time)).where(
                Account.type == Currency.TIME, Account.balance_time > 0
            )
        )
        total_regio = await self.session.execute(
            select(func.sum(Account.balance_regio)).where(
                Account.type == Currency.REGIO, Account.balance_regio > 0
            )
        )

        pending = await self.session.execute(
            select(func.count(PaymentRequest.id)).where(
                PaymentRequest.status == PaymentStatus.PENDING
            )
        )

        return SystemStats(
            total_users=total_users.one()[0] or 0,
            active_users=active_users.one()[0] or 0,
            verification_pending_users=verification_pending_users.one()[0] or 0,
            total_time_volume=total_time.one()[0] or 0,
            total_regio_volume=total_regio.one()[0] or 0,
            pending_disputes=pending.one()[0] or 0,
        )

    # USER MANAGEMENT
    async def get_users_rich(
        self, query: str = None, skip: int = 0, limit: int = 20
    ) -> UserListResponse:
        """
        Fetches users AND their balances in one go.
        """
        stmt = select(User).offset(skip).limit(limit).order_by(desc(User.created_at))

        if query:
            stmt = stmt.where(
                or_(
                    User.user_code.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                    User.last_name.ilike(f"%{query}%"),
                    User.middle_name.ilike(f"%{query}%"),
                    User.first_name.ilike(f"%{query}%"),
                )
            )

        stmt = stmt.options(selectinload(User.accounts))

        results = await self.session.execute(stmt)
        users = results.scalars().all()

        count_stmt = select(func.count(User.id))
        if query:
            count_stmt = count_stmt.where(
                or_(
                    User.user_code.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                    User.last_name.ilike(f"%{query}%"),
                    User.first_name.ilike(f"%{query}%"),
                )
            )
        count = (await self.session.execute(count_stmt)).one()[0]

        data = []
        for u in users:
            time_bal = 0
            regio_bal = Decimal("0.00")
            for acc in u.accounts:
                if acc.type == Currency.TIME:
                    time_bal = acc.balance_time
                elif acc.type == Currency.REGIO:
                    regio_bal = acc.balance_regio

            role = "Admin" if u.is_system_admin else "User"

            data.append(
                UserAdminView(
                    # id=u.id,
                    user_code=u.user_code,
                    email=u.email,
                    full_name=u.full_name,
                    avatar_url=u.avatar_url,
                    role=role,
                    trust_level=u.trust_level,
                    is_active=u.is_active,
                    # is_verified=u.is_verified,
                    verification_status=u.verification_status,
                    balance_time=time_bal,
                    balance_regio=regio_bal,
                    created_at=u.created_at,
                )
            )

        return UserListResponse(data=data, count=count)

    # TAG MANAGEMENT
    async def get_tags_with_usage(
        self, pending_only: bool = False
    ) -> List[TagAdminView]:
        """
        Fetches tags and calculates usage count from Active Listings using PostgreSQL JSONB aggregation.
        """
        # Fetch the definitions from Tag table
        stmt = select(Tag)
        if pending_only:
            stmt = stmt.where(Tag.is_official.is_(False))
        else:
            stmt = stmt.where(Tag.is_official)

        tags = (await self.session.execute(stmt)).scalars().all()

        # Calculate Usage Counts
        # We unroll the JSONB array 'tags' in the listings table into rows and count them
        # Query equivalent: SELECT jsonb_array_elements_text(tags), count(*) FROM listings WHERE status='ACTIVE' GROUP BY 1
        stats_stmt = (
            select(
                func.jsonb_array_elements_text(Listing.tags).label("tag_str"),
                func.count(Listing.id),
            )
            .where(Listing.status == ListingStatus.ACTIVE)
            .group_by(func.jsonb_array_elements_text(Listing.tags))
        )

        stats_results = await self.session.execute(stats_stmt)
        # Create map: {"vegan": 12, "bio": 5}
        usage_map = {row[0]: row[1] for row in stats_results.all()}

        # Merge Data
        results = []
        for t in tags:
            results.append(
                TagAdminView(
                    id=t.id,
                    name=t.name,
                    name_de=t.name_de,
                    name_en=t.name_en,
                    name_hu=t.name_hu,
                    is_official=t.is_official,
                    usage_count=usage_map.get(t.name, 0),
                )
            )

        return results

    async def update_tag(self, tag_id: int, update_data: TagAdminUpdate):
        tag = await self.session.get(Tag, tag_id)
        if not tag:
            raise TagNotFound()

        data = update_data.model_dump(exclude_unset=True)
        tag.sqlmodel_update(data)

        self.session.add(tag)
        await self.session.commit()
        await self.session.refresh(tag)
        return tag

    async def delete_tag(self, tag_id: int):
        tag = await self.session.get(Tag, tag_id)
        if not tag:
            raise TagNotFound()
        await self.session.delete(tag)
        await self.session.commit()
        # No return, route returns 204 (no content)

    # BROADCAST
    async def send_broadcast(self, data: BroadcastCreate):
        # Filter Logic
        stmt = select(User)
        if data.target_audience == "VERIFIED":
            stmt = stmt.where(User.is_verified)
        elif data.target_audience == "PENDING":
            stmt = stmt.where(User.is_verified.is_(False))
        # ... other filters

        count_res = await self.session.execute(
            select(func.count()).select_from(stmt.subquery())
        )
        count = count_res.one()[0]

        # MOCK IMPLEMENTATION FOR PHASE 1
        print(f"[BROADCAST] Sent '{data.title}' to {count} users.")

        return {"sent_count": count, "message": "Broadcast queued successfully"}

    # DISPUTES
    async def get_pending_disputes(self) -> List[DisputePublic]:
        stmt = (
            select(PaymentRequest)
            .where(PaymentRequest.status == PaymentStatus.PENDING)
            .options(
                selectinload(PaymentRequest.creditor),
                selectinload(PaymentRequest.debtor),
            )
            .order_by(desc(PaymentRequest.created_at))
        )
        results = await self.session.execute(stmt)
        reqs = results.scalars().all()

        mapped = []
        for r in reqs:
            mapped.append(
                DisputePublic(
                    request_id=r.id,
                    debtor_code=r.debtor.user_code,
                    debtor_name=r.debtor.full_name,
                    creditor_code=r.creditor.user_code,
                    creditor_name=r.creditor.full_name,
                    amount_time=r.amount_time,
                    amount_regio=r.amount_regio,
                    status=r.status,
                    description=r.description,
                    created_at=r.created_at,
                )
            )
        return mapped
