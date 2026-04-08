import uuid
from typing import Any, List

from fastapi import APIRouter, BackgroundTasks, Query, status

from app.banking.dependencies import BankingServiceDep
from app.banking.schemas import (
    BalanceResponse,
    DisputeCreate,
    PaymentRequestCreate,
    PaymentRequestPublic,
    TransactionHistory,
    TransactionPublic,
    TransferRequest,
)
from app.core.schemas import Message
from app.email.schemas import PaymentRequestRejectedEmailData
from app.email.tasks import send_payment_request_rejected_email_task
from app.users.dependencies import CurrentUser

router = APIRouter()


@router.get(
    "/balance",
    response_model=BalanceResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "description": "Account not found for user."
        }
    },
)
async def get_my_balance(
    current_user: CurrentUser, service: BankingServiceDep
) -> Any:
    """
    Get current user's balance, trust level, and limits.
    """
    return await service.get_balance_info(current_user.user_code)


@router.get(
    "/history",
    response_model=TransactionHistory,
    responses={
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "Internal server error."
        }
    },
)
async def get_my_history(
    current_user: CurrentUser,
    service: BankingServiceDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    days: int = Query(None, description="Filter history by last N days"),
) -> Any:
    """
    Get paginated transaction history.
    """
    return await service.get_transaction_history(
        user=current_user, page=page, page_size=page_size, days=days
    )


@router.post(
    "/transfer",
    response_model=TransactionPublic,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Insufficient funds, self-transfer, or invalid amounts."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Receiver user not found."},
        status.HTTP_409_CONFLICT: {
            "description": "Transaction conflict (concurrency). Please retry."
        },
    },
)
async def transfer_funds(
    request: TransferRequest,
    current_user: CurrentUser,
    service: BankingServiceDep,
) -> Any:
    """
    Execute a direct transfer of Time or Regio to another user.
    """
    return await service.transfer_funds(
        sender_code=current_user.user_code,
        receiver_code=request.receiver_code,
        amount_time=request.amount_time,
        amount_regio=request.amount_regio,
        reference=request.reference,
    )


@router.post(
    "/requests",
    response_model=PaymentRequestPublic,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Invalid amounts or self-request."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Debtor user not found."},
    },
)
async def create_payment_request(
    data: PaymentRequestCreate,
    current_user: CurrentUser,
    service: BankingServiceDep,
) -> Any:
    """
    Send a request for payment (invoice) to another user.
    """
    return await service.create_payment_request(
        creditor_code=current_user.user_code,
        debtor_code=data.debtor_code,
        amount_time=data.amount_time,
        amount_regio=data.amount_regio,
        description=data.description,
    )


@router.get("/requests/incoming", response_model=List[PaymentRequestPublic])
async def get_incoming_requests(
    current_user: CurrentUser, service: BankingServiceDep
) -> Any:
    """
    Get pending requests where I am the Debtor.
    """
    return await service.get_incoming_payment_requests(current_user)


@router.get("/requests/outgoing", response_model=List[PaymentRequestPublic])
async def get_outgoing_requests(
    current_user: CurrentUser, service: BankingServiceDep
) -> Any:
    """
    Get pending requests where I am the Creditor.
    """
    return await service.get_outgoing_payment_requests(current_user)


@router.post(
    "/requests/{request_id}/confirm",
    response_model=Message,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Insufficient funds or invalid status."
        },
        status.HTTP_403_FORBIDDEN: {
            "description": "Not authorized to pay this request."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Request not found."},
    },
)
async def confirm_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep,
) -> Message:
    """
    Pay a received request.
    """
    await service.process_payment_request(
        request_id=request_id, debtor_id=current_user.id, action="APPROVE"
    )
    return Message(message="Payment executed successfully")


@router.post(
    "/requests/{request_id}/reject",
    response_model=Message,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": "Not authorized to reject this request."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Request not found."},
    },
)
async def reject_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep,
    background_tasks: BackgroundTasks,
) -> Message:
    """
    Decline a received request. The creditor is notified by email.
    """
    # Load relationships before processing so we can notify the creditor
    req = await service.get_payment_request_with_users(request_id)
    await service.process_payment_request(
        request_id=request_id, debtor_id=current_user.id, action="REJECT"
    )
    background_tasks.add_task(
        send_payment_request_rejected_email_task,
        PaymentRequestRejectedEmailData(
            user_first_name=req.creditor.first_name,
            user_email=req.creditor.email,
            debtor_name=current_user.full_name,
            amount_time=req.amount_time,
            amount_regio=float(req.amount_regio),
            description=req.description,
        ),
    )
    return Message(message="Request rejected")


@router.post(
    "/requests/{request_id}/dispute",
    response_model=PaymentRequestPublic,
    responses={
        status.HTTP_400_BAD_REQUEST: {
            "description": "Request is not in a rejected state or dispute already raised."
        },
        status.HTTP_403_FORBIDDEN: {
            "description": "Only the creditor can raise a dispute."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Request not found."},
    },
)
async def raise_dispute(
    request_id: uuid.UUID,
    data: DisputeCreate,
    current_user: CurrentUser,
    service: BankingServiceDep,
) -> Any:
    """
    Contest a rejected payment request and escalate it to admin review.

    Only the creditor can raise a dispute, and only on requests the debtor has rejected.
    The dispute will appear in the admin queue for resolution.
    """
    req = await service.raise_dispute(request_id, current_user.id, data.reason)
    return PaymentRequestPublic(
        id=req.id,
        creditor_code=req.creditor.user_code,
        creditor_name=req.creditor.full_name,
        debtor_code=req.debtor.user_code,
        debtor_name=req.debtor.full_name,
        amount_time=req.amount_time,
        amount_regio=req.amount_regio,
        description=req.description,
        status=req.status,
        dispute_raised=req.dispute_raised,
        dispute_reason=req.dispute_reason,
        dispute_raised_at=req.dispute_raised_at,
        created_at=req.created_at,
    )


@router.post(
    "/requests/{request_id}/cancel",
    response_model=Message,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": "Not authorized to cancel this request."
        },
        status.HTTP_404_NOT_FOUND: {"description": "Request not found."},
    },
)
async def cancel_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep,
) -> Message:
    """
    Cancel a request I sent.
    """
    await service.cancel_payment_request(request_id, current_user.id)
    return Message(message="Request cancelled")
