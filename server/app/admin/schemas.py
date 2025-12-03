from datetime import datetime
from decimal import Decimal

from typing import  Optional
from pydantic import BaseModel

from app.banking.enums import PaymentStatus

# DASHBOARD STATS
class SystemStats(BaseModel):
    total_users: int
    active_users: int
    total_time_volume: int # Must be 0
    total_regio_volume: Decimal # Must be 0
    pending_disputes: int

# DISPUTE MANAGEMENT
class DisputeAction(BaseModel):
    action: str  # "APPROVE" (Force Execute) or "REJECT" (Cancel)
    reason: Optional[str] = None

class DisputePublic(BaseModel):
    request_id: str
    debtor_code: str
    creditor_code: str
    amount_time: int
    amount_regio: Decimal
    status: PaymentStatus
    created_at: datetime
