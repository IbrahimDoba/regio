from typing import Any
from decimal import Decimal

from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.accounts import Account
from app.models.users import User, UserCreate, UserUpdate, UsersPublic
from app.enums import Currency
from app.utils.generators import generate_user_code
from app.core.security import get_password_hash, verify_password


async def create_user(
    *, 
    session: AsyncSession, 
    user_create: UserCreate
) -> User:
    # Generate user code
    new_code = generate_user_code()
    retries = 10
    
    # Check for user code conflict
    while retries > 0:
        existing_user = await get_user_by_code(session=session, user_code=new_code)
        if existing_user:
            new_code = generate_user_code()
            retries -= 1
            continue # Retries generation up to 10 times
        break

    if retries == 0:
        raise ValueError("System saturated, could not generate new code")

    # Attach code to user data
    user_create.user_code = new_code
    
    # Create User DB Object
    db_obj = User.model_validate(
        user_create, 
        update={"hashed_password": get_password_hash(user_create.password)}
    )
    
    session.add(db_obj)
    # We must flush here to get the db_obj.id generated before creating accounts
    await session.flush() 

    # Create Default Accounts (TIME & REGIO)
    account_time = Account(
        user_id=db_obj.id,
        type=Currency.TIME,
        balance_time=0,
        balance_regio=Decimal(0)
    )
    account_regio = Account(
        user_id=db_obj.id,
        type=Currency.REGIO,
        balance_time=0,
        balance_regio=Decimal(0)
    )

    session.add(account_time)
    session.add(account_regio)

    await session.commit()
    await session.refresh(db_obj)
    
    return db_obj

async def update_user(
    *, 
    session: AsyncSession, 
    db_user: User, 
    user_in: UserUpdate
) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        password_hash = get_password_hash(password)
        extra_data["password_hash"] = password_hash
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def get_user_by_email(
    *, 
    session: AsyncSession, 
    email: str
) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = await session.execute(statement)
    return session_user.scalars().first()

async def get_user_by_code(
    *, 
    session: AsyncSession, 
    user_code: str
) -> User | None:
    statement = select(User).where(User.user_code == user_code)
    session_user = await session.execute(statement)
    return session_user.scalars().first()

async def authenticate(
    *, 
    session: AsyncSession, 
    email: str, 
    password: str
) -> User | str:
    db_user = await get_user_by_email(session=session, email=email)
    if not db_user:
        return "User does not exist"
    if not verify_password(password, db_user.password_hash):
        return "Incorrect password"
    return db_user

async def get_users(
    *,
    session: AsyncSession,
    skip: int | None,
    limit: int | None
) -> UsersPublic:
    count_statement = select(func.count()).select_from(User)
    count_result = await session.execute(count_statement)
    count = count_result.scalar()

    # Filter to only active non-system-admin users
    statement = select(User) \
        .offset(skip) \
        .limit(limit) \
        .where(User.is_active == True, User.is_system_admin == False)
    users_results = await session.execute(statement)
    users = users_results.scalars().all()

    return UsersPublic(data=users, count=count)
