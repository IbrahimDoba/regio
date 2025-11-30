import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlmodel import SQLModel

from app.banking.enums import TransactionType, PaymentStatus
from app.users.enums import TrustLevel

# SHARED
class MoneyAmount(SQLModel):
    time: int
    regio: Decimal

class AccountLimits(SQLModel):
    max_debt_time: int
    max_debt_regio: Decimal
    available_time: int
    available_regio: Decimal

# RESPONSES
class BalanceResponse(SQLModel):
    user_code: str
    trust_level: TrustLevel
    total_time_earned: int
    balance: MoneyAmount
    limits: AccountLimits

class TransactionPublic(SQLModel):
    id: uuid.UUID
    date: datetime
    type: TransactionType
    other_party_code: str
    other_party_name: str
    amount_time: int
    amount_regio: Decimal
    reference: Optional[str] = None
    is_system_fee: bool = False

class TransactionHistory(SQLModel):
    data: List[TransactionPublic]
    count: int

class PaymentRequestPublic(SQLModel):
    id: uuid.UUID
    creditor_code: str
    creditor_name: str
    debtor_code: str
    debtor_name: str
    amount_time: int
    amount_regio: Decimal
    description: Optional[str]
    status: PaymentStatus
    created_at: datetime

# REQUESTS
class TransferRequest(SQLModel):
    receiver_code: str
    amount_time: int = 0
    amount_regio: Decimal = Decimal("0.00")
    reference: str

class PaymentRequestCreate(SQLModel):
    debtor_code: str
    amount_time: int = 0
    amount_regio: Decimal = Decimal("0.00")
    description: str

class DemurrageResult(SQLModel):
    processed_users: int
    total_minutes_collected: int
