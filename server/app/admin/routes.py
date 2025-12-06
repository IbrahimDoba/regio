import uuid
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.schemas import Message
from app.users.dependencies import get_user_service
from app.banking.dependencies import get_banking_service
from app.users.service import UserService
from app.banking.service import BankingService
from app.users.exceptions import UserNotFound
from app.users.schemas import UserPublic, UserAdminUpdate
from app.users.exceptions import ActionNotPermitted
from app.admin.schemas import SystemStats, DisputePublic, DisputeAction, UserListResponse, TagAdminUpdate, TagAdminView
from app.admin.dependencies import AdminServiceDep
from app.users.dependencies import get_current_active_system_admin

# Protect entire router
router = APIRouter(dependencies=[Depends(get_current_active_system_admin)])

"""DASHBOARD"""
@router.get("/stats", response_model=SystemStats)
async def get_dashboard_stats(
    service: AdminServiceDep
) -> Any:
    """
    Get high-level system health metrics.
    """
    return await service.get_system_stats()

"""USER MANAGEMENT"""
@router.get("/users", response_model=UserListResponse)
async def list_users_rich(
    service: AdminServiceDep,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> Any:
    """
    Get users with balances, search, and pagination.
    """
    return await service.get_users_rich(query=q, skip=skip, limit=limit)


@router.patch("/users/{user_code}", response_model=UserPublic)
async def update_user_details(
    user_code: str,
    user_in: UserAdminUpdate,
    user_service: UserService = Depends(get_user_service)
) -> Any:
    """
    Force update a user's profile (Real Name correction, Trust Level override).
    """
    try:
        return await user_service.admin_update_user(user_code, user_in)
    except UserNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except ActionNotPermitted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden action, cannot modify this user"
        )


@router.patch("/users/{user_code}/toggle", response_model=UserPublic)
async def toggle_user_active(
    user_code: str,
    user_service: UserService = Depends(get_user_service)
) -> Any:
    """
    Ban/Unban a user.
    """
    try:
        user = await user_service.get_user_by_code(user_code)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_status = not user.is_active
        return await user_service.admin_update_user(user_code, UserAdminUpdate(is_active=new_status))
    except ActionNotPermitted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden action, cannot modify this user"
        )

"""TAG MANAGEMENT"""
@router.get("/tags", response_model=List[TagAdminView])
async def get_tags(
    service: AdminServiceDep,
    pending: bool = False
) -> Any:
    """
    Get tags with usage counts. 
    Use pending=True for the 'Pending User Tags' table.
    """
    return await service.get_tags_with_usage(pending_only=pending)

@router.patch("/tags/{tag_id}")
async def update_tag(
    tag_id: uuid.UUID,
    update_data: TagAdminUpdate,
    service: AdminServiceDep
) -> Any:
    tag = await service.update_tag(tag_id, update_data)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: uuid.UUID,
    service: AdminServiceDep
) -> Message:
    success = await service.delete_tag(tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    return Message(message="Tag deleted")

"""BROADCAST"""
# @router.post("/broadcast")
# async def send_broadcast(
#     data: BroadcastCreate,
#     service: AdminServiceDep
# ) -> Any:
#     return await service.send_broadcast(data)

"""BANKING / DISPUTES"""
@router.get("/disputes", response_model=List[DisputePublic])
async def list_pending_disputes(
    admin_service: AdminServiceDep
) -> Any:
    return await admin_service.get_pending_disputes()

@router.post("/disputes/{request_id}/resolve")
async def resolve_dispute(
    request_id: uuid.UUID,
    action_in: DisputeAction,
    banking_service: BankingService = Depends(get_banking_service)
) -> Any:
    try:
        return await banking_service.process_payment_request(
            request_id=request_id,
            debtor_id=None, # None signals Admin Override
            action=action_in.action
        )
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))
