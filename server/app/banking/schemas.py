import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlmodel import SQLModel
from pydantic import Field, ConfigDict

from app.banking.enums import TransactionType, PaymentStatus
from app.users.enums import TrustLevel

# SHARED
class MoneyAmounts(SQLModel):
    """
    Represents a dual-currency value (Time + Regio).
    """
    time: int = Field(..., description="Amount in Time Minutes (integer).")
    regio: Decimal = Field(..., description="Amount in Regio (decimal).")

class AccountLimits(SQLModel):
    """
    Current credit limits and available spending power for a user.
    """
    max_debt_time: int = Field(..., description="Maximum allowed negative balance for Time.")
    max_debt_regio: Decimal = Field(..., description="Maximum allowed negative balance for Regio.")
    available_time: int = Field(..., description="How many more minutes can be spent before hitting the limit.")
    available_regio: Decimal = Field(..., description="How much more Regio can be spent before hitting the limit.")

# RESPONSES
class BalanceResponse(SQLModel):
    """
    Full financial snapshot of a user.
    """
    user_code: str = Field(..., description="User's public ID.")
    trust_level: TrustLevel = Field(..., description="Current trust level (determines limits).")
    total_time_earned: int = Field(..., description="Lifetime minutes earned (Reputation score).")
    balance: MoneyAmounts = Field(..., description="Current wallet balances.")
    limits: AccountLimits = Field(..., description="Current spending limits.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_code": "A1000",
                "trust_level": "T3",
                "total_time_earned": 1200,
                "balance": {"time": 60, "regio": "25.50"},
                "limits": {
                    "max_debt_time": -300,
                    "max_debt_regio": "-50.00",
                    "available_time": 360,
                    "available_regio": "75.50"
                }
            }
        }
    )

class TransactionPublic(SQLModel):
    """
    Public view of a single transaction.
    """
    id: uuid.UUID = Field(..., description="Unique transaction ID.")
    date: datetime = Field(..., description="Timestamp of the transaction.")
    type: TransactionType = Field(..., description="Type: TRANSFER, SYSTEM_FEE, DEMURRAGE, etc.")
    
    other_party_code: str = Field(..., description="User code of the counterparty (Sender or Receiver).")
    other_party_name: str = Field(..., description="Name of the counterparty.")
    
    amount_time: int = Field(..., description="Amount of Time moved.")
    amount_regio: Decimal = Field(..., description="Amount of Regio moved.")
    reference: Optional[str] = Field(default=None, description="User provided note or system reference.")
    is_system_fee: bool = Field(default=False, description="True if this was an automated system charge.")

class TransactionMeta(SQLModel):
    page: int = Field(..., description="Current page number.")
    page_size: int = Field(..., description="Items per page.")
    total_count: int = Field(..., description="Total number of transactions found.")
    total_pages: int = Field(..., description="Total pages available.")

class TransactionHistory(SQLModel):
    data: List[TransactionPublic] = Field(..., description="List of transactions.")
    meta: TransactionMeta = Field(..., description="Pagination metadata.")

class PaymentRequestPublic(SQLModel):
    """
    Public view of an invoice/payment request.
    """
    id: uuid.UUID = Field(..., description="Unique request ID.")
    creditor_code: str = Field(..., description="User asking for money.")
    creditor_name: str = Field(..., description="Name of creditor.")
    debtor_code: str = Field(..., description="User who owes money.")
    debtor_name: str = Field(..., description="Name of debtor.")
    
    amount_time: int = Field(..., description="Requested Time amount.")
    amount_regio: Decimal = Field(..., description="Requested Regio amount.")
    description: Optional[str] = Field(default=None, description="Reason for the request.")
    
    status: PaymentStatus = Field(..., description="PENDING, APPROVED, REJECTED, CANCELLED.")
    created_at: datetime = Field(..., description="Creation timestamp.")

# REQUESTS
class TransferRequest(SQLModel):
    receiver_code: str = Field(..., description="User code of the recipient (e.g. A1000).")
    amount_time: int = Field(default=0, ge=0, description="Amount of minutes to send.")
    amount_regio: Decimal = Field(default=Decimal("0.00"), ge=0, description="Amount of Regio to send.")
    reference: str = Field(..., min_length=1, max_length=140, description="Short note about the transfer.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "receiver_code": "B2000",
                "amount_time": 60,
                "amount_regio": "10.50",
                "reference": "For the gardening help"
            }
        }
    )

class PaymentRequestCreate(SQLModel):
    debtor_code: str = Field(..., description="User code of the person who owes you.")
    amount_time: int = Field(default=0, ge=0, description="Minutes requested.")
    amount_regio: Decimal = Field(default=Decimal("0.00"), ge=0, description="Regio requested.")
    description: str = Field(..., min_length=1, max_length=140, description="Reason for the request.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "debtor_code": "C3000",
                "amount_time": 30,
                "description": "Lunch split"
            }
        }
    )

class DemurrageResult(SQLModel):
    processed_users: int = Field(..., description="Count of users affected.")
    total_minutes_collected: int = Field(..., description="Total minutes removed from circulation.")
