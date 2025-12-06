from datetime import datetime
from decimal import Decimal
import uuid
from typing import Optional, List
from pydantic import BaseModel

from app.banking.enums import PaymentStatus
from app.users.enums import TrustLevel, VerificationStatus

# DASHBOARD STATS
class SystemStats(BaseModel):
    total_users: int
    active_users: int
    verification_pending_users: int
    total_time_volume: int 
    total_regio_volume: Decimal
    pending_disputes: int

# USER MANAGEMENT
class UserAdminView(BaseModel):
    """
    Rich User view for Admin Table (Includes Balances)
    """
    # id: uuid.UUID
    user_code: str
    email: str
    full_name: str
    avatar_url: Optional[str]
    
    role: str # "User", "Admin"
    trust_level: TrustLevel
    is_active: bool
    # is_verified: bool
    verification_status: VerificationStatus
    
    # Financials
    balance_time: int
    balance_regio: Decimal
    
    created_at: datetime

class UserListResponse(BaseModel):
    data: List[UserAdminView]
    count: int

# TAG MANAGEMENT
class TagAdminUpdate(BaseModel):
    name_de: Optional[str] = None
    name_en: Optional[str] = None
    name_hu: Optional[str] = None
    is_official: bool = True # Approving sets this to True

class TagAdminView(BaseModel):
    id: uuid.UUID
    name: str
    name_de: Optional[str]
    name_en: Optional[str]
    name_hu: Optional[str]
    is_official: bool
    usage_count: int = 0

# DISPUTES
class DisputeAction(BaseModel):
    action: str  # "APPROVE" (Force Execute) or "REJECT" (Cancel)
    reason: Optional[str] = None

class DisputePublic(BaseModel):
    request_id: uuid.UUID
    debtor_code: str
    debtor_name: str
    creditor_code: str
    creditor_name: str
    amount_time: int
    amount_regio: Decimal
    status: PaymentStatus
    description: Optional[str]
    created_at: datetime

# BROADCAST
class BroadcastCreate(BaseModel):
    title: str
    body: str
    target_audience: str # "ALL", "VERIFIED", "T1", etc.
