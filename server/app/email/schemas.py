from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class EmailMessage(BaseModel):
    """Internal schema representing a composed email ready to send."""

    to: EmailStr
    subject: str
    html_body: str
    plain_body: Optional[str] = None
    # CID → raw bytes for inline images referenced as cid:<key> in the HTML
    inline_images: dict[str, bytes] = Field(default_factory=dict)


class VerificationEmailData(BaseModel):
    """Data for rendering the registration welcome email."""

    user_first_name: str
    user_email: EmailStr
    calendly_url: str


class VerificationStatusEmailData(BaseModel):
    """Data for rendering verification status change emails."""

    user_first_name: str
    user_email: EmailStr
    new_status: str
    reason: Optional[str] = None


class BroadcastDigestEmailData(BaseModel):
    """Data for rendering the broadcast digest email."""

    user_first_name: str
    user_email: EmailStr
    broadcast_title: str
    broadcast_body: str
    broadcast_link: Optional[str] = None


class PaymentReminderEmailData(BaseModel):
    """Remind the debtor that a payment request is overdue."""

    user_first_name: str
    user_email: EmailStr
    creditor_name: str
    amount_time: int
    amount_regio: float
    description: Optional[str] = None
    days_pending: int


class PaymentEnforcedEmailData(BaseModel):
    """Notify both parties that a payment was automatically executed by the system."""

    user_first_name: str
    user_email: EmailStr
    is_creditor: bool
    other_party_name: str
    amount_time: int
    amount_regio: float
    description: Optional[str] = None


class PaymentRequestRejectedEmailData(BaseModel):
    """Notify the creditor that the debtor has rejected their payment request."""

    user_first_name: str
    user_email: EmailStr
    debtor_name: str
    amount_time: int
    amount_regio: float
    description: Optional[str] = None


class DisputeResolvedEmailData(BaseModel):
    """Data for rendering the dispute resolution notification email."""

    user_first_name: str
    user_email: EmailStr
    is_creditor: bool  # True = creditor, False = debtor
    outcome: str  # "APPROVED" or "CANCELLED"
    admin_note: Optional[str] = None
    amount_time: int
    amount_regio: float
    description: Optional[str] = None
