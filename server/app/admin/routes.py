import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import SessionDep
from app.users.dependencies import get_user_service
from app.banking.dependencies import get_banking_service
from app.users.service import UserService
from app.banking.service import BankingService
from app.users.exceptions import UserNotFound
from app.users.schemas import UserPublic, UserAdminUpdate
from app.admin.schemas import SystemStats, DisputePublic, DisputeAction
from app.admin.dependencies import AdminUser, AdminServiceDep

# Protect entire router
router = APIRouter(dependencies=[Depends(AdminUser)])

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


@router.patch("/users/{user_code}/toggle", response_model=UserPublic)
async def toggle_user_active(
    user_code: str,
    user_service: UserService = Depends(get_user_service)
) -> Any:
    """
    Ban/Unban a user.
    """
    user = await user_service.get_user_by_code(user_code)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.is_active
    return await user_service.admin_update_user(user.id, UserAdminUpdate(is_active=new_status))

# BANKING / DISPUTES

@router.get("/disputes", response_model=List[DisputePublic])
async def list_pending_disputes(
    admin_service: AdminServiceDep
) -> Any:
    """
    View all stalled/pending payment requests.
    """
    # In a real implementation, you'd map the DB models to the DisputePublic schema
    # fetching User Codes for creditor/debtor.
    # For now returning raw objects (FastAPI will attempt mapping)
    return await admin_service.get_pending_disputes()

@router.post("/disputes/{request_id}/resolve")
async def resolve_dispute(
    request_id: uuid.UUID,
    action_in: DisputeAction,
    banking_service: BankingService = Depends(get_banking_service)
) -> Any:
    """
    Force Execute (Approve) or Reject a payment request.
    """
    try:
        # TODO: implement on banking service
        return await banking_service.process_payment_request(
            request_id=request_id,
            debtor_id=None, # None signals Admin Override
            action=action_in.action
        )
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))
