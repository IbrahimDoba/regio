from typing import Optional
import uuid

from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import get_password_hash
from app.users.models import User
from app.users.schemas import UserCreate, UserUpdate, UserAdminUpdate, UsersPublic
from app.users.exceptions import UserAlreadyExists, UserNotFound, SystemSaturated, ImmutableFieldUpdate
from app.users.utils import generate_user_code

# from app.banking.service import BankingService
# from app.auth.service import InviteService
# from app.chat.service import ChatService
# from app.auth.service import AuthService

class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session
        # self.banking_service = BankingService(session)
        # self.chat_service = ChatService(session)

    async def get_users(self, skip: int = 0, limit: int = 100) -> UsersPublic:
        # Get total number of rows in table
        count_statement = select(func.count()).select_from(User)
        count_result = await self.session.execute(count_statement)
        count = count_result.scalar()

        # Filter to only active non-system-admin users
        statement = select(User) \
            .offset(skip) \
            .limit(limit) \
            .where(User.is_active == True, User.is_system_admin == False)
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

    async def create_user(self, user_in: UserCreate) -> User:
        # Check Email Uniqueness
        if await self.get_user_by_email(user_in.email):
            raise UserAlreadyExists()
        
        # TODO: Instantiate auth service
        # auth_service = AuthService(self.session)

        # TODO: Validate and consume invite code
        # await auth_service.consume_invite(user_in.invite_code)

        # Generate Unique User Code (Retry Logic)
        user_code = generate_user_code()
        retries = 10
        while retries > 0:
            # Check collision
            existing = await self.session.execute(select(User).where(User.user_code == user_code))
            if not existing.scalar_one_or_none():
                break
            user_code = generate_user_code()
            retries -= 1
        
        if retries == 0:
            raise SystemSaturated() # Failed to generate a unique system ID after 10 tries
        
        # Create DB Object
        db_user = User(
            user_code=user_code,
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            first_name=user_in.first_name,
            middle_name=user_in.middle_name,
            last_name=user_in.last_name,
            address=user_in.address,
            is_active=True,
            is_verified=False # Requires video verification later
        )
        
        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)

        # Create initial accounts
        # await self.banking_service.create_initial_accounts(user_id=db_user.id)

        # Create Matrix account
        # await self.chat_service.create_matrix_account(user_id=db_user.id)

        # Generate invite codes for user
        # await auth_service.create_user_invites(db_user.id)

        return db_user

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
            "first_name", "last_name", "middle_name", 
            "user_code", "trust_level", "is_verified", "is_system_admin"
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

    async def admin_update_user(self, user_code: str, user_in: UserAdminUpdate) -> User:
        """
        Admin override. Can change names if typo correction is needed.
        """
        db_user = await self.get_user_by_code(user_code)
        if not db_user:
            raise UserNotFound()
            
        update_data = user_in.model_dump(exclude_unset=True)
        db_user.sqlmodel_update(update_data)
        
        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return db_user
