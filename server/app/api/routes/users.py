import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status, Depends

from app.crud import users_crud
from app.models.users import *
from app.models.system import Message
from app.api.deps import SessionDep, CurrentUser, get_current_active_system_admin 


router = APIRouter()

@router.get("", response_model=UsersPublic, dependencies=[Depends(get_current_active_system_admin)])
async def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users with pagination.
    """

    users_public = await users_crud.get_users(
        session=session, skip=skip, limit=limit
    )

    return users_public


@router.post("", response_model=UserPublic, dependencies=[Depends(get_current_active_system_admin)])
async def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = await users_crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already taken",
        )

    try:
        user = await users_crud.create_user(session=session, user_create=user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/me", response_model=UserPublic)
async def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.patch("/me", response_model=UserPublic, dependencies=[Depends(get_current_active_system_admin)])
async def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = await users_crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email taken by another user"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserPublic, dependencies=[Depends(get_current_active_system_admin)])
async def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep
) -> Any:
    """
    Get a specific user by id.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.patch(
    "/{user_id}", 
    response_model=UserPublic, 
    dependencies=[Depends(get_current_active_system_admin)]
)
async def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user via their UUID in the URL and a UserUpdate dictionary containing their email and or other basic information.
    """

    db_user = await session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The user with this ID does not exist in the system",
        )
    if user_in.email:
        existing_user = await users_crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email taken by another user"
            )

    db_user = await users_crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return db_user


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_system_admin)])
async def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """
    Delete a user.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Super users are not allowed to delete themselves"
        )
    await session.delete(user)
    await session.commit()
    return Message(message="User deleted successfully")


@router.patch(
    "/toggle/{user_id}", 
    dependencies=[Depends(get_current_active_system_admin)],
    description="Toggle a user's active status to the opposite of what it currently is.",
    response_description="User has been (de)activated as a Message response."
)
async def toggle(
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID
) -> Message:    
    """
    Toggle a user's active status.
    """

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Super users are not allowed to toggle themselves"
        )
    # Flip status
    new_status = not user.is_active
    user_in = UserUpdate(is_active=new_status)
    await users_crud.update_user(session=session, db_user=user, user_in=user_in)
    await session.commit()

    message = "User has been activated" if new_status else "User has been deactivated"

    return Message(message=message)
