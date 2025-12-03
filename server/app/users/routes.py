import uuid
from typing import Any, List

from fastapi import APIRouter, HTTPException, status

from app.auth.dependencies import AuthServiceDep
from app.auth.schemas import InvitePublic
from app.users.schemas import (
    UserCreate, 
    UserPublic, 
    UsersPublic,
    UserUpdate, 
    UserAdminUpdate,
)

from app.users.exceptions import (
    UserAlreadyExists, 
    SystemSaturated, 
    UserNotFound,
    ImmutableFieldUpdate
)

from app.users.dependencies import (
    CurrentUser,
    CurrentAdmin,
    UserServiceDep
)

router = APIRouter()

@router.get("", response_model=UsersPublic)
async def read_users(
    service: UserServiceDep, 
    _: CurrentAdmin,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Retrieve users with pagination.
    """
    try:
        return await service.get_users(skip, limit)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    service: UserServiceDep
) -> Any:
    """
    Public registration endpoint. Requires valid Invite Code (put any dummy text as invite code for now).
    """
    try:
        return await service.create_user(user_in)
    except UserAlreadyExists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already taken")
    except SystemSaturated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="System capacity reached, failed to generate unique user code")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=UserPublic)
async def read_user_me(
    current_user: CurrentUser
) -> Any:
    """
    Get current user profile.
    """
    return current_user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    user_in: UserUpdate,
    current_user: CurrentUser,
    service: UserServiceDep
) -> Any:
    """
    Update own profile. Real Names are NOT updateable here.
    """
    try:
        return await service.update_user(current_user.id, user_in)
    except UserNotFound:
        raise HTTPException(status_code=404, detail="User not found")
    except ImmutableFieldUpdate:
        raise HTTPException(status_code=400, detail="Cannot update real names or other protected fields")
    

@router.get("/invites", response_model=List[InvitePublic])
async def read_my_invites(
    current_user: CurrentUser,
    service: AuthServiceDep
) -> Any:
    """
    Get all active invite codes for the current user.
    """
    return await service.get_user_invites(current_user.id)


@router.get("/{user_code}", response_model=UserPublic)
async def read_user_by_code(
    user_code: uuid.UUID,
    _: CurrentAdmin,
    service: UserServiceDep
) -> Any:
    """
    Admin: Get specific user by code.
    """
    user = await service.get_user_by_code(user_code)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# @router.patch("/admin/{user_code}", response_model=UserPublic)
# async def update_user_by_admin(
#     user_code: uuid.UUID,
#     user_in: UserAdminUpdate,
#     _: CurrentAdmin,
#     service: UserServiceDep
# ) -> Any:
#     """
#     Admin: Update user (can edit Real Names and Trust Levels).
#     """
#     try:
#         return await service.admin_update_user(user_code, user_in)
#     except UserNotFound:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


# @router.patch("/toggle/{user_code}", response_model=UserPublic)
# async def toggle_user_active_status(
#     user_code: uuid.UUID,
#     _: CurrentAdmin,
#     service: UserServiceDep
# ) -> Any:
#     """
#     Admin: Toggle a user's active status.
#     """
#     try:
#         # Fetch user first
#         user = await service.get_user_by_code(user_code)
#         if not user:
#             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
#         # Prepare toggle
#         new_status = not user.is_active
#         update_data = UserAdminUpdate(is_active=new_status)
        
#         return await service.admin_update_user(user_code, update_data)
#     except UserNotFound:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
