import uuid
from typing import Any, List

from fastapi import APIRouter, status, Query

from app.auth.dependencies import AuthServiceDep
from app.auth.schemas import InvitePublic
from app.users.schemas import (
    UserCreate, 
    UserPublic, 
    UsersPublic,
    UserUpdate
)
from app.users.exceptions import (
    UserNotFound
)
from app.users.dependencies import (
    CurrentUser,
    CurrentAdmin,
    UserServiceDep
)

router = APIRouter()

@router.get("", response_model=UsersPublic, status_code=status.HTTP_200_OK, responses={
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
})
async def read_users(
    service: UserServiceDep, 
    _: CurrentAdmin,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Retrieve users with pagination.
    
    Only accessible by Admins. Returns a list of all registered users
    with pagination support.
    
    - **skip**: Number of records to skip.
    - **limit**: Maximum number of records to return.
    """
    return await service.get_users(skip, limit)
    

@router.get("/search", response_model=List[UserPublic], status_code=status.HTTP_200_OK, responses={
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
})
async def search_users(
    service: UserServiceDep,
    _: CurrentUser,
    q: str = Query(min_length=2, description="Search string (name or user code)."),
    limit: int = 10
) -> Any:
    """
    Search users by name or code for autocomplete.
    
    Useful for features like "Send Money" or "Invite" where you need to find
    another user in the system.
    
    - **q**: The search query (minimum 2 characters).
    - **limit**: Max results to return (default 10).
    """
    return await service.search_users(q, limit)


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED, responses={
    status.HTTP_400_BAD_REQUEST: {"description": "Invalid invite code or input data."},
    status.HTTP_409_CONFLICT: {"description": "Email already registered."},
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "System saturated (no IDs left) or internal error."}
})
async def register_user(
    user_in: UserCreate,
    service: UserServiceDep
) -> Any:
    """
    Public registration endpoint. 
    
    Requires a valid Invite Code to create a new account.
    The system automatically assigns a unique 5-digit User Code upon success.
    
    - **user_in**: Registration payload including invite code and profile data.
    """
    return await service.create_user(user_in)


@router.get("/me", response_model=UserPublic, status_code=status.HTTP_200_OK)
async def read_user_me(
    current_user: CurrentUser
) -> Any:
    """
    Get current user profile.
    
    Returns the public profile information of the currently logged-in user.
    """
    return current_user


@router.patch("/me", response_model=UserPublic, status_code=status.HTTP_200_OK, responses={
    status.HTTP_400_BAD_REQUEST: {"description": "Attempted to update immutable field (e.g. Real Name)."},
    status.HTTP_404_NOT_FOUND: {"description": "User not found."}
})
async def update_user_me(
    user_in: UserUpdate,
    current_user: CurrentUser,
    service: UserServiceDep
) -> Any:
    """
    Update own profile. 
    
    Allows updating mutable fields like address or bio.
    Real Names (First/Last) are **immutable** and cannot be changed here.
    
    - **user_in**: Fields to update.
    """
    return await service.update_user(current_user.id, user_in)
    

@router.get("/invites", response_model=List[InvitePublic], status_code=status.HTTP_200_OK)
async def read_my_invites(
    current_user: CurrentUser,
    service: AuthServiceDep
) -> Any:
    """
    Get the invite codes for the current user.
    
    Returns the user's available invite codes (Limited to most recent 3).
    These codes can be shared with others to allow them to register.
    """
    return await service.get_user_invites(current_user.id)

@router.get(
    path="/invites/request",
    response_model=List[InvitePublic],
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."},
    }
)
async def request_new_invites(
    current_user: CurrentUser,
    auth_service: AuthServiceDep,
) -> List[InvitePublic]:
    """
    Void existing unused invites and generate 3 new ones.
    """
    return await auth_service.request_invites(current_user.id)


@router.get("/{user_code}", response_model=UserPublic, status_code=status.HTTP_200_OK, responses={
    status.HTTP_403_FORBIDDEN: {"description": "User is not an admin."},
    status.HTTP_404_NOT_FOUND: {"description": "User with this code not found."}
})
async def read_user_by_code(
    user_code: str,
    _: CurrentUser,
    service: UserServiceDep
) -> Any:
    """
    Admin: Get specific user by code.
    
    Fetch a user's profile using their UUID or internal code.
    
    - **user_code**: The identifier of the user to fetch.
    """
    user = await service.get_user_by_code(user_code)
    if not user:
        raise UserNotFound()
    return user
