import uuid
from typing import Any, List

from fastapi import APIRouter, status, Query

from app.core.schemas import Message
from app.users.dependencies import CurrentUser
from app.banking.dependencies import BankingServiceDep
from app.banking.schemas import (
    BalanceResponse, 
    TransactionHistory, 
    TransferRequest, 
    TransactionPublic,
    PaymentRequestCreate,
    PaymentRequestPublic
)

router = APIRouter()

@router.get("/balance", response_model=BalanceResponse, responses={
    status.HTTP_404_NOT_FOUND: {"description": "Account not found for user."}
})
async def get_my_balance(
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Get current user's balance, trust level, and limits.
    """
    return await service.get_balance_info(current_user.user_code)


@router.get("/history", response_model=TransactionHistory, responses={
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"description": "Internal server error."}
})
async def get_my_history(
    current_user: CurrentUser,
    service: BankingServiceDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    days: int = Query(None, description="Filter history by last N days")
) -> Any:
    """
    Get paginated transaction history.
    """
    return await service.get_transaction_history(
        user=current_user,
        page=page,
        page_size=page_size,
        days=days
    )


@router.post("/transfer", response_model=TransactionPublic, responses={
    status.HTTP_400_BAD_REQUEST: {"description": "Insufficient funds, self-transfer, or invalid amounts."},
    status.HTTP_404_NOT_FOUND: {"description": "Receiver user not found."},
    status.HTTP_409_CONFLICT: {"description": "Transaction conflict (concurrency). Please retry."}
})
async def transfer_funds(
    request: TransferRequest,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Execute a direct transfer of Time or Regio to another user.
    """
    return await service.transfer_funds(
        sender_code=current_user.user_code,
        receiver_code=request.receiver_code,
        amount_time=request.amount_time,
        amount_regio=request.amount_regio,
        reference=request.reference
    )


@router.post("/requests", response_model=PaymentRequestPublic, responses={
    status.HTTP_400_BAD_REQUEST: {"description": "Invalid amounts or self-request."},
    status.HTTP_404_NOT_FOUND: {"description": "Debtor user not found."}
})
async def create_payment_request(
    data: PaymentRequestCreate,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Send a request for payment (invoice) to another user.
    """
    return await service.create_payment_request(
        creditor_code=current_user.user_code,
        debtor_code=data.debtor_code,
        amount_time=data.amount_time,
        amount_regio=data.amount_regio,
        description=data.description
    )


@router.get("/requests/incoming", response_model=List[PaymentRequestPublic])
async def get_incoming_requests(
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Get pending requests where I am the Debtor.
    """
    return await service.get_incoming_payment_requests(current_user)


@router.get("/requests/outgoing", response_model=List[PaymentRequestPublic])
async def get_outgoing_requests(
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Get pending requests where I am the Creditor.
    """
    return await service.get_outgoing_payment_requests(current_user)


@router.post("/requests/{request_id}/confirm", response_model=Message, responses={
    status.HTTP_400_BAD_REQUEST: {"description": "Insufficient funds or invalid status."},
    status.HTTP_403_FORBIDDEN: {"description": "Not authorized to pay this request."},
    status.HTTP_404_NOT_FOUND: {"description": "Request not found."}
})
async def confirm_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Message:
    """
    Pay a received request.
    """
    await service.process_payment_request(
        request_id=request_id,
        debtor_id=current_user.id,
        action="APPROVE"
    )
    return Message(message="Payment executed successfully")


@router.post("/requests/{request_id}/reject", response_model=Message, responses={
    status.HTTP_403_FORBIDDEN: {"description": "Not authorized to reject this request."},
    status.HTTP_404_NOT_FOUND: {"description": "Request not found."}
})
async def reject_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Message:
    """
    Decline a received request.
    """
    await service.process_payment_request(
        request_id=request_id,
        debtor_id=current_user.id,
        action="REJECT"
    )
    return Message(message="Request rejected")


@router.post("/requests/{request_id}/cancel", response_model=Message, responses={
    status.HTTP_403_FORBIDDEN: {"description": "Not authorized to cancel this request."},
    status.HTTP_404_NOT_FOUND: {"description": "Request not found."}
})
async def cancel_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Message:
    """
    Cancel a request I sent.
    """
    await service.cancel_payment_request(request_id, current_user.id)
    return Message(message="Request cancelled")
