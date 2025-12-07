import uuid
from typing import Any, List

from fastapi import APIRouter, status, HTTPException, Query

from app.core.schemas import Message
from app.users.dependencies import CurrentUser
from app.users.exceptions import UserNotFound
from app.banking.dependencies import BankingServiceDep
from app.banking.schemas import (
    BalanceResponse, 
    TransactionHistory, 
    TransferRequest, 
    TransactionPublic,
    PaymentRequestCreate,
    PaymentRequestPublic
)
from app.banking.exceptions import (
    InsufficientFunds,
    TransactionConflict,
    AccountNotFound,
    InvalidTransactionAmount,
    SelfTransferError,
    PaymentRequestNotFound,
    UnauthorizedPaymentRequestAccess,
    InvalidPaymentRequestStatus
)

router = APIRouter()

@router.get("/balance", response_model=BalanceResponse)
async def get_my_balance(
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Get current user's balance, trust level, and limits.
    """
    try:
        return await service.get_balance_info(current_user.user_code)
    except AccountNotFound as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/history", response_model=TransactionHistory)
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
    try:
        return await service.get_transaction_history(
            user=current_user,
            page=page,
            page_size=page_size,
            days=days
        )
    except Exception as e:
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/transfer", response_model=TransactionPublic)
async def transfer_funds(
    request: TransferRequest,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Execute a direct transfer of Time or Regio to another user.
    """
    try:
        tx = await service.transfer_funds(
            sender_code=current_user.user_code,
            receiver_code=request.receiver_code,
            amount_time=request.amount_time,
            amount_regio=request.amount_regio,
            reference=request.reference
        )
        
        return tx
        
    except (InvalidTransactionAmount, SelfTransferError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid transaction parameters")
    except UserNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found")
    except InsufficientFunds as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except TransactionConflict as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/requests", response_model=PaymentRequestPublic)
async def create_payment_request(
    data: PaymentRequestCreate,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Send a request for payment (invoice) to another user.
    """
    try:
        req = await service.create_payment_request(
            creditor_code=current_user.user_code,
            debtor_code=data.debtor_code,
            amount_time=data.amount_time,
            amount_regio=data.amount_regio,
            description=data.description
        )
        
        return req
    except UserNotFound:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debtor user not found")
    except SelfTransferError:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot request money from yourself")
    except InvalidTransactionAmount as e:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/requests/incoming", response_model=List[PaymentRequestPublic])
async def get_incoming_requests(
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Get pending requests where I am the Debtor.

    PENDING requests only.
    """
    requests = await service.get_incoming_payment_requests(current_user)
    
    # Map to schema
    results = []
    for r in requests:
        results.append(PaymentRequestPublic(
            id=r.id,
            creditor_code=r.creditor.user_code,
            creditor_name=r.creditor.full_name,
            debtor_code=current_user.user_code,
            debtor_name=current_user.full_name,
            amount_time=r.amount_time,
            amount_regio=r.amount_regio,
            description=r.description,
            status=r.status,
            created_at=r.created_at
        ))
    return results


@router.get("/requests/outgoing", response_model=List[PaymentRequestPublic])
async def get_outgoing_requests(
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Any:
    """
    Get pending requests where I am the Creditor (I asked someone for money).

    PENDING requests only.
    """
    requests = await service.get_outgoing_payment_requests(current_user)
    
    results = []
    for r in requests:
        results.append(PaymentRequestPublic(
            id=r.id,
            creditor_code=current_user.user_code,
            creditor_name=current_user.full_name, 
            debtor_code=r.debtor.user_code,
            debtor_name=r.debtor.full_name,
            amount_time=r.amount_time,
            amount_regio=r.amount_regio,
            description=r.description,
            status=r.status,
            created_at=r.created_at
        ))
    return results


@router.post("/requests/{request_id}/confirm")
async def confirm_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Message:
    """
    Pay a received request.
    """
    try:
        await service.process_payment_request(
            request_id=request_id,
            debtor_id=current_user.id,
            action="APPROVE"
        )
        return Message(message="Payment executed successfully")
    except PaymentRequestNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    except UnauthorizedPaymentRequestAccess:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    except InsufficientFunds as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except InvalidPaymentRequestStatus as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/requests/{request_id}/reject")
async def reject_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Message:
    """
    Decline a received request.
    """
    try:
        await service.process_payment_request(
            request_id=request_id,
            debtor_id=current_user.id,
            action="REJECT"
        )
        return Message(message="Request rejected")
    except PaymentRequestNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    except UnauthorizedPaymentRequestAccess:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    except InvalidPaymentRequestStatus as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/requests/{request_id}/cancel")
async def cancel_payment_request(
    request_id: uuid.UUID,
    current_user: CurrentUser,
    service: BankingServiceDep
) -> Message:
    """
    Cancel a request I sent (No longer needed or mistake made).
    """
    try:
        await service.cancel_payment_request(request_id, current_user.id)
        return Message(message="Request cancelled")
    except PaymentRequestNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    except UnauthorizedPaymentRequestAccess:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this request")
    except InvalidPaymentRequestStatus as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
