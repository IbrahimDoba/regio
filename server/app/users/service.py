from typing import Optional, List
import uuid
from datetime import datetime, timezone

from sqlmodel import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.auth.security import get_password_hash
from app.users.models import User
from app.users.enums import VerificationStatus
from app.users.schemas import UserCreate, UserUpdate, UserAdminUpdate, UsersPublic
from app.users.exceptions import (
    UserAlreadyExists,
    UserNotFound,
    SystemSaturated,
    ImmutableFieldUpdate,
    ActionNotPermitted,
)
from app.users.utils import generate_user_code

from app.banking.service import BankingService
from app.auth.service import AuthService
# from app.chat.service import ChatService


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_users(self, skip: int = 0, limit: int = 100) -> UsersPublic:
        # Get total number of rows in table
        count_statement = select(func.count()).select_from(User)
        count_result = await self.session.execute(count_statement)
        count = count_result.scalar()

        # Filter to only active non-system-admin users
        statement = (
            select(User)
            .offset(skip)
            .limit(limit)
            .where(User.is_active, User.is_system_admin.is_(False))
        )
        users_results = await self.session.execute(statement)

        users = users_results.scalars().all()

        # Subtract number of results from count for final number of active users
        result_count = count - len(users)

        return UsersPublic(data=users, count=result_count)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        statement = select(User).where(User.email == email)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        return await self.session.get(User, user_id)

    async def get_user_by_code(self, user_code: str) -> Optional[User]:
        statement = select(User).where(User.user_code == user_code)
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def search_users(self, query: str, limit: int = 10) -> List[User]:
        """
        Public user search for autocomplete.
        Matches: user_code OR (First Name + Last Name + Middle Name)
        """
        # Ensure we don't return system admins or inactive users
        base_filter = [User.is_active, User.is_system_admin.is_(False)]

        # Determine if query is code or name
        conditions = [
            User.user_code.ilike(f"{query}%"),
            User.first_name.ilike(f"%{query}%"),
            User.middle_name.ilike(f"%{query}%"),
            User.last_name.ilike(f"%{query}%"),
        ]

        # Multi-part name matching
        if " " in query:
            parts = query.split(" ")
            if len(parts) >= 2:
                p0 = parts[0]
                p1 = parts[1]

                # Last + First
                conditions.append(
                    (User.last_name.ilike(f"%{p0}%"))
                    & (User.first_name.ilike(f"%{p1}%"))
                )
                # Last + Middle
                conditions.append(
                    (User.last_name.ilike(f"%{p0}%"))
                    & (User.middle_name.ilike(f"%{p1}%"))
                )
                # Middle + First
                conditions.append(
                    (User.middle_name.ilike(f"%{p0}%"))
                    & (User.first_name.ilike(f"%{p1}%"))
                )

        statement = (
            select(User).where(*base_filter).where(or_(*conditions)).limit(limit)
        )

        results = await self.session.execute(statement)
        return results.scalars().all()

    async def create_user(self, user_in: UserCreate) -> User:
        # Check Email Uniqueness
        existing_user = await self.get_user_by_email(user_in.email)
        if existing_user:
            raise UserAlreadyExists()

        # Generate Unique User Code (Retry Logic)
        user_code = generate_user_code()
        retries = 10
        while retries > 0:
            # Check collision
            existing = await self.session.execute(
                select(User).where(User.user_code == user_code)
            )
            if not existing.scalar_one_or_none():
                break
            user_code = generate_user_code()
            retries -= 1

        if retries == 0:
            raise SystemSaturated()  # Failed to generate a unique system ID after 10 tries

        # Create DB Object
        db_user = User.model_validate(
            user_in,
            update={
                "password_hash": get_password_hash(user_in.password),
                "user_code": user_code,
                "is_active": True,  # Active but not verified
                # "is_verified": False,
                "verification_status": VerificationStatus.PENDING,  # Admin must verify
            },
        )

        try:
            self.session.add(db_user)
            await self.session.flush()  # Generate ID

            # Initialize Invites & CONSUME USED INVITE
            auth_service = AuthService(self.session)

            # Mark the invite they used as consumed and link it to them
            if user_in.invite_code:
                await auth_service.consume_invite(
                    code=user_in.invite_code, consumer_id=db_user.id
                )

            # Create 3 new invites for this new user
            await auth_service.create_user_invites(db_user.id)

            # Initialize Banking Accounts after verifying invite
            banking_service = BankingService(self.session)
            await banking_service.create_initial_accounts(db_user.id)

            # Initialize Matrix (Placeholder)
            # await self.chat_service.create_matrix_user(db_user)

            await self.session.commit()
            await self.session.refresh(db_user)
            return db_user

        except Exception as e:
            await self.session.rollback()
            raise e

    async def update_user(self, user_id: uuid.UUID, user_in: UserUpdate) -> User:
        """
        Standard user update. RESTRICTED: Cannot change names.
        """
        db_user = await self.get_user_by_id(user_id)
        if not db_user:
            raise UserNotFound()

        update_data = user_in.model_dump(exclude_unset=True)

        # ENFORCEMENT OF IMMUTABILITY
        immutable_fields = {
            "first_name",
            "last_name",
            "middle_name",
            "user_code",
            "trust_level",
            "verification_status",
            "is_system_admin",
        }

        # Check if any forbidden key exists in the update payload
        if any(field in update_data for field in immutable_fields):
            raise ImmutableFieldUpdate()

        if "password" in update_data:
            hashed = get_password_hash(update_data["password"])
            update_data["password_hash"] = hashed
            del update_data["password"]

        db_user.sqlmodel_update(update_data)
        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return db_user

    async def admin_update_user(
        self, user_code: str, user_in: UserAdminUpdate, current_admin: User
    ) -> User:
        """
        Admin override. Can change names if typo correction is needed.
        """
        # Prevent system sink user updates
        if user_code == settings.SYSTEM_SINK_CODE:
            raise ActionNotPermitted()

        db_user = await self.get_user_by_code(user_code)
        if not db_user:
            raise UserNotFound()

        update_data = user_in.model_dump(exclude_unset=True)
        db_user.sqlmodel_update(update_data)

        # Update verification fields (verified_by, verified_at)
        if "verification_status" in update_data:
            if update_data["verification_status"] == VerificationStatus.VERIFIED:
                db_user.verified_by = current_admin
                db_user.verified_at = datetime.now(timezone.utc)
        # NOTE: Updating verification_status of user in update_user is now deprecated, please use admin_service.verify_user. The UserAdminUpdate schema will be updated in the future.

        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return db_user
