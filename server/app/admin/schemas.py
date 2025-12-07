from datetime import datetime
from decimal import Decimal
import uuid
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.banking.enums import PaymentStatus
from app.users.enums import TrustLevel, VerificationStatus

# DASHBOARD STATS
class SystemStats(BaseModel):
    total_users: int = Field(..., description="Total number of registered users.")
    active_users: int = Field(..., description="Number of currently active users.")
    verification_pending_users: int = Field(..., description="Users awaiting identity verification.")
    total_time_volume: int = Field(..., description="Total volume of Time currency in circulation.")
    total_regio_volume: Decimal = Field(..., description="Total volume of Regio currency in circulation.")
    pending_disputes: int = Field(..., description="Count of unresolved disputes.")

# USER MANAGEMENT
class UserAdminView(BaseModel):
    """
    Rich User view for Admin Table (Includes Balances)
    """
    # id: uuid.UUID
    user_code: str = Field(..., description="Public user identifier (e.g. A1000).")
    email: str = Field(..., description="User's email address.")
    full_name: str = Field(..., description="Concatenated first and last name.")
    avatar_url: Optional[str] = Field(default=None, description="URL to profile image.")
    
    role: str = Field(..., description="Role: 'User' or 'Admin'.")
    trust_level: TrustLevel = Field(..., description="Current trust/reputation level.")
    is_active: bool = Field(..., description="If False, user is banned/disabled.")
    # is_verified: bool
    verification_status: VerificationStatus = Field(..., description="Status of ID verification.")
    
    # Financials
    balance_time: int = Field(..., description="Current Time Token balance.")
    balance_regio: Decimal = Field(..., description="Current Regio Coin balance.")
    
    created_at: datetime = Field(..., description="Date of registration.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_code": "A1000",
                "email": "jane@example.com",
                "full_name": "Jane Doe",
                "role": "User",
                "trust_level": "T3",
                "is_active": True,
                "verification_status": "VERIFIED",
                "balance_time": 120,
                "balance_regio": "50.50",
                "created_at": "2024-01-01T12:00:00Z"
            }
        }
    )

class UserListResponse(BaseModel):
    data: List[UserAdminView] = Field(..., description="List of rich user objects.")
    count: int = Field(..., description="Total count of users matching the query.")

# TAG MANAGEMENT
class TagAdminUpdate(BaseModel):
    name_de: Optional[str] = Field(default=None, description="German translation.")
    name_en: Optional[str] = Field(default=None, description="English translation.")
    name_hu: Optional[str] = Field(default=None, description="Hungarian translation.")
    is_official: bool = Field(default=True, description="Set to True to approve a pending user tag.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name_en": "Gardening",
                "name_de": "Gartenarbeit",
                "is_official": True
            }
        }
    )

class TagAdminView(BaseModel):
    id: uuid.UUID = Field(..., description="Unique Tag ID.")
    name: str = Field(..., description="Internal identifier/name.")
    name_de: Optional[str] = Field(default=None, description="German translation.")
    name_en: Optional[str] = Field(default=None, description="English translation.")
    name_hu: Optional[str] = Field(default=None, description="Hungarian translation.")
    is_official: bool = Field(..., description="True if system approved, False if user suggested.")
    usage_count: int = Field(default=0, description="Number of listings currently using this tag.")

# DISPUTES
class DisputeAction(BaseModel):
    action: str = Field(..., description="Resolution action: 'APPROVE' (force transaction) or 'REJECT' (cancel transaction).")
    reason: Optional[str] = Field(default=None, description="Administrative note for the resolution.")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "action": "APPROVE",
                "reason": "Evidence provided via email confirmed delivery."
            }
        }
    )

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
    title: str = Field(..., description="Title of the broadcast message.")
    body: str = Field(..., description="Content of the message.")
    target_audience: str = Field(..., description="Target group key (e.g. 'ALL', 'VERIFIED').")
