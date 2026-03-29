from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.users.enums import TrustLevel


class BroadcastCreateRequest(BaseModel):
    """
    Payload for creating a new broadcast.
    """

    title: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    link: Optional[str] = Field(
        default=None, description="Optional deep link or URL."
    )

    # Filter Logic:
    # If None or Empty List -> Send to ALL users.
    # If [TrustLevel.T1, TrustLevel.T6] -> Send only to users with trust_level T1 OR T6.
    target_trust_levels: Optional[List[TrustLevel]] = Field(
        default=None,
        description="List of specific trust levels to target. Leave empty to broadcast to ALL.",
    )


class InboxItemResponse(BaseModel):
    """
    How the user sees the message in their inbox.
    """

    id: UUID = Field(
        ..., description="The ID of the specific inbox item (UserBroadcast)."
    )
    broadcast_id: UUID
    title: str
    body: str
    link: Optional[str]
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BroadcastStatsResponse(BaseModel):
    """
    Admin view: Confirmation of the sent broadcast.
    """

    broadcast_id: UUID
    recipient_count: int
    created_at: datetime
