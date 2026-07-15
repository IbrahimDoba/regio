import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import desc, func, or_, select

from app.admin.schemas import (
    BroadcastCreate,
    DisputePublic,
    SystemStats,
    TagAdminUpdate,
    TagAdminView,
    TagsAdminListResponse,
    UserAdminView,
    UserListResponse,
)
from app.banking.enums import Currency, PaymentStatus
from app.banking.exceptions import PaymentRequestNotFound
from app.banking.models import Account, PaymentRequest
from app.listings.enums import ListingStatus
from app.listings.exceptions import TagNotFound
from app.listings.models import Listing, Tag
from app.users.enums import VerificationStatus
from app.users.exceptions import UserNotFound
from app.users.models import User
from app.users.service import UserService


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
            select(func.count(User.id)).where(
                User.verification_status == VerificationStatus.VERIFIED
            )
        )
        verification_pending_users = await self.session.execute(
            select(func.count(User.id)).where(
                User.verification_status == VerificationStatus.PENDING
            )
        )

        # Zero-sum ledger: net balance across all accounts (incl. negatives)
        # should settle to ~0. Summing every account surfaces that invariant.
        total_time = await self.session.execute(
            select(func.sum(Account.balance_time)).where(
                Account.type == Currency.TIME
            )
        )
        total_regio = await self.session.execute(
            select(func.sum(Account.balance_regio)).where(
                Account.type == Currency.REGIO
            )
        )

        pending = await self.session.execute(
            select(func.count(PaymentRequest.id)).where(
                PaymentRequest.dispute_raised.is_(True),
                PaymentRequest.status == PaymentStatus.REJECTED,
            )
        )

        return SystemStats(
            total_users=total_users.one()[0] or 0,
            active_users=active_users.one()[0] or 0,
            verification_pending_users=verification_pending_users.one()[0]
            or 0,
            total_time_volume=total_time.one()[0] or 0,
            total_regio_volume=total_regio.one()[0] or 0,
            pending_disputes=pending.one()[0] or 0,
        )

    # USER MANAGEMENT
    async def verify_user(self, user_code: str, current_admin: User) -> User:
        """
        Allows for an admin to approve a user currently pending verification.

        :param user_code: Unique user code of user being verified.
        :type user_code: str
        :param current_admin: Currently authenticated admin performing the action.
        :type current_admin: User
        :return: DB object of the updated user.
        :rtype: User
        """

        user_service = UserService(self.session)

        db_user = await user_service.get_user_by_code(user_code)
        if not db_user:
            raise UserNotFound()

        # Update verification fields (verification_status, verified_by, verified_at)
        db_user.verified_by = current_admin
        db_user.verification_status = VerificationStatus.VERIFIED
        db_user.verified_at = datetime.now(timezone.utc)

        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return db_user

    async def get_users_rich(
        self, query: str = None, skip: int = 0, limit: int = 20
    ) -> UserListResponse:
        """
        Fetches users AND their balances in one go.
        """
        stmt = (
            select(User)
            .offset(skip)
            .limit(limit)
            .order_by(desc(User.created_at))
        )

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
                    verification_status=u.verification_status,
                    verified_at=u.verified_at,
                    verified_by=u.verified_by.full_name
                    if u.verified_by
                    else None,
                    balance_time=time_bal,
                    balance_regio=regio_bal,
                    created_at=u.created_at,
                )
            )

        return UserListResponse(data=data, count=count)

    # TAG MANAGEMENT
    async def get_tags_with_usage(
        self,
        pending_only: bool = False,
        skip: int = 0,
        limit: int = 50,
        q: Optional[str] = None,
    ) -> TagsAdminListResponse:
        """
        Fetches tags with usage counts; supports search and pagination.
        """
        base_stmt = select(Tag)
        if pending_only:
            base_stmt = base_stmt.where(Tag.is_official.is_(False))
        else:
            base_stmt = base_stmt.where(Tag.is_official)

        if q:
            ilike = f"%{q}%"
            base_stmt = base_stmt.where(
                or_(
                    Tag.name.ilike(ilike),
                    Tag.name_de.ilike(ilike),
                    Tag.name_en.ilike(ilike),
                    Tag.name_hu.ilike(ilike),
                )
            )

        total = (
            await self.session.execute(
                select(func.count()).select_from(base_stmt.subquery())
            )
        ).scalar_one()

        tags = (
            (
                await self.session.execute(
                    base_stmt.order_by(Tag.name).offset(skip).limit(limit)
                )
            )
            .scalars()
            .all()
        )

        if not tags:
            return TagsAdminListResponse(data=[], count=total)

        stats_stmt = (
            select(
                func.jsonb_array_elements_text(Listing.tags).label("tag_str"),
                func.count(Listing.id),
            )
            .where(Listing.status == ListingStatus.ACTIVE)
            .group_by(func.jsonb_array_elements_text(Listing.tags))
        )
        usage_map = {
            row[0]: row[1]
            for row in (await self.session.execute(stats_stmt)).all()
        }

        results = [
            TagAdminView(
                id=t.id,
                name=t.name,
                name_de=t.name_de,
                name_en=t.name_en,
                name_hu=t.name_hu,
                is_official=t.is_official,
                usage_count=usage_map.get(t.name, 0),
            )
            for t in tags
        ]

        return TagsAdminListResponse(data=results, count=total)

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

        return {
            "sent_count": count,
            "message": "Broadcast queued successfully",
        }

    # DISPUTES
    @staticmethod
    def _resolution_for_status(status: PaymentStatus) -> str:
        """
        Derives the dispute resolution state from the payment request status.

        A disputed request stays REJECTED until an admin acts. Resolving it sets
        the status to EXECUTED (admin forced the payment) or CANCELLED (admin
        sided with the debtor). ``dispute_raised`` is never reset, so resolved
        disputes remain identifiable for the record.
        """
        if status == PaymentStatus.EXECUTED:
            return "APPROVED"
        if status == PaymentStatus.CANCELLED:
            return "CANCELLED"
        return "UNRESOLVED"

    async def get_disputes(
        self, filter: str = "unresolved"
    ) -> List[DisputePublic]:
        """
        Lists disputed payment requests, scoped by ``filter``.

        - **unresolved**: still awaiting admin action (status REJECTED).
        - **resolved**: already approved (EXECUTED) or cancelled (CANCELLED).
        - **all**: every request that ever had a dispute raised.
        """
        stmt = (
            select(PaymentRequest)
            .where(PaymentRequest.dispute_raised.is_(True))
            .options(
                selectinload(PaymentRequest.creditor),
                selectinload(PaymentRequest.debtor),
            )
            .order_by(desc(PaymentRequest.created_at))
        )

        if filter == "unresolved":
            stmt = stmt.where(PaymentRequest.status == PaymentStatus.REJECTED)
        elif filter == "resolved":
            stmt = stmt.where(
                PaymentRequest.status.in_(
                    [PaymentStatus.EXECUTED, PaymentStatus.CANCELLED]
                )
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
                    resolution=self._resolution_for_status(r.status),
                    description=r.description,
                    dispute_reason=r.dispute_reason,
                    dispute_raised_at=r.dispute_raised_at,
                    dispute_admin_note=r.dispute_admin_note,
                    created_at=r.created_at,
                )
            )
        return mapped

    async def get_dispute_by_id(self, request_id: uuid.UUID) -> PaymentRequest:
        """Load a disputed payment request with user relationships for notification purposes."""
        stmt = (
            select(PaymentRequest)
            .where(PaymentRequest.id == request_id)
            .options(
                selectinload(PaymentRequest.creditor),
                selectinload(PaymentRequest.debtor),
            )
        )
        req = (await self.session.execute(stmt)).scalar_one_or_none()
        if not req:
            raise PaymentRequestNotFound()
        return req
