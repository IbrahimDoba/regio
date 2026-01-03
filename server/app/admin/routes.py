import uuid
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.users.dependencies import get_user_service
from app.banking.dependencies import get_banking_service
from app.users.service import UserService
from app.banking.service import BankingService
from app.users.schemas import UserPublic, UserAdminUpdate
from app.admin.schemas import (
    SystemStats,
    DisputePublic,
    DisputeAction,
    UserListResponse,
    TagAdminUpdate,
    TagAdminView,
)
from app.admin.dependencies import AdminServiceDep
from app.users.dependencies import get_current_active_system_admin, CurrentUser

# Protect entire router
router = APIRouter(dependencies=[Depends(get_current_active_system_admin)])

"""DASHBOARD"""


@router.get(
    "/stats",
    response_model=SystemStats,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_401_UNAUTHORIZED: {"description": "Not authenticated."},
        status.HTTP_403_FORBIDDEN: {"description": "Not a system admin."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def get_dashboard_stats(service: AdminServiceDep) -> Any:
    """
    Get high-level system health metrics.

    Returns counters for users, volume of currency in circulation, and pending tasks.
    """
    return await service.get_system_stats()


"""USER MANAGEMENT"""


@router.get(
    "/users",
    response_model=UserListResponse,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
    },
)
async def list_users_rich(
    service: AdminServiceDep,
    q: Optional[str] = Query(None, description="Search by name or user code."),
    skip: int = Query(0, ge=0, description="Pagination offset."),
    limit: int = Query(20, le=100, description="Pagination limit."),
) -> Any:
    """
    Get users with balances, search, and pagination.

    Returns a 'rich' view of users that includes their current financial balances
    (Time and Regio), which is not available in the standard user endpoints.
    """
    return await service.get_users_rich(query=q, skip=skip, limit=limit)


@router.patch(
    "/users/{user_code}",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "User not found."},
        status.HTTP_403_FORBIDDEN: {
            "description": "Action not permitted on this user."
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def update_user_details(
    user_code: str,
    user_in: UserAdminUpdate,
    current_admin: CurrentUser,
    user_service: UserService = Depends(get_user_service),
) -> Any:
    """
    Force update a user's profile.

    Allows Admins to correct Real Names (immutable for users) or manually change
    Trust Levels and Verification Status.
    """
    return await user_service.admin_update_user(user_code, user_in, current_admin)


@router.patch(
    "/users/verify-user/{user_code}",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "User not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
    operation_id="verify_user",
)
async def verify_user(
    user_code: str, current_admin: CurrentUser, admin_service: AdminServiceDep
) -> Any:
    """
    Approve a user's status and set to VERIFIED.
    """
    return await admin_service.verify_user(user_code, current_admin)


@router.patch(
    "/users/{user_code}/toggle",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "User not found."},
        status.HTTP_403_FORBIDDEN: {
            "description": "Cannot ban this user (e.g. another admin)."
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def toggle_user_active(
    user_code: str, user_service: UserService = Depends(get_user_service)
) -> Any:
    """
    Ban/Unban a user.

    Toggles the `is_active` flag. Banned users cannot log in.
    """
    user = await user_service.get_user_by_code(user_code)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    new_status = not user.is_active
    return await user_service.admin_update_user(
        user_code, UserAdminUpdate(is_active=new_status)
    )


"""TAG MANAGEMENT"""


@router.get(
    "/tags",
    response_model=List[TagAdminView],
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
    },
)
async def get_tags(
    service: AdminServiceDep,
    pending: bool = Query(
        False, description="If True, returns only tags waiting for approval."
    ),
) -> Any:
    """
    Get tags with usage counts.

    - **pending**: Filter for user-suggested tags that need approval.
    """
    return await service.get_tags_with_usage(pending_only=pending)


@router.patch(
    "/tags/{tag_id}",
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Tag not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def update_tag(
    tag_id: int, update_data: TagAdminUpdate, service: AdminServiceDep
) -> Any:
    """
    Update or Approve a tag.

    Used to add translations or officially approve a user-generated tag.
    """
    return await service.update_tag(tag_id, update_data)


@router.delete(
    "/tags/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_404_NOT_FOUND: {"description": "Tag not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def delete_tag(tag_id: int, service: AdminServiceDep) -> None:
    """
    Delete a tag completely.
    """
    await service.delete_tag(tag_id)


"""BROADCAST"""
# @router.post("/broadcast")
# async def send_broadcast(
#     data: BroadcastCreate,
#     service: AdminServiceDep
# ) -> Any:
#     return await service.send_broadcast(data)

"""BANKING / DISPUTES"""


@router.get(
    "/disputes",
    response_model=List[DisputePublic],
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
    },
)
async def list_pending_disputes(admin_service: AdminServiceDep) -> Any:
    """
    List all payment requests marked as DISPUTED.
    """
    return await admin_service.get_pending_disputes()


@router.post(
    "/disputes/{request_id}/resolve",
    status_code=status.HTTP_200_OK,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Invalid action or payment state."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Payment request not found."},
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        },
    },
)
async def resolve_dispute(
    request_id: uuid.UUID,
    action_in: DisputeAction,
    banking_service: BankingService = Depends(get_banking_service),
) -> Any:
    """
    Resolve a dispute.

    - **APPROVE**: Overrides the debtor's rejection and executes the payment.
    - **REJECT**: Cancels the payment request permanently.
    """
    return await banking_service.process_payment_request(
        request_id=request_id,
        debtor_id=None,  # None signals Admin Override
        action=action_in.action,
    )
