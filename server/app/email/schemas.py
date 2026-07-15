from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.users.enums import Language


class EmailMessage(BaseModel):
    """Internal schema representing a composed email ready to send."""

    to: EmailStr
    subject: str
    html_body: str
    plain_body: Optional[str] = None
    # CID → raw bytes for inline images referenced as cid:<key> in the HTML
    inline_images: dict[str, bytes] = Field(default_factory=dict)


class _LocalizedEmailData(BaseModel):
    """Base for email payloads: carries the recipient's preferred language.

    Drives which locale catalog + subject the EmailService renders. Defaults
    to English so senders that have no user context (e.g. the system admin
    notification) render in EN.
    """

    language: Language = Language.EN


class VerificationEmailData(_LocalizedEmailData):
    """Data for rendering the registration welcome email."""

    user_first_name: str
    user_email: EmailStr
    verification_url: str


class AdminNewUserEmailData(_LocalizedEmailData):
    """Notify the system admin that a new user registered and is pending verification."""

    admin_email: EmailStr  # recipient — the system admin (SYSTEM_SINK_EMAIL)
    new_user_name: str  # full name of the registrant
    new_user_email: EmailStr
    new_user_code: str
    new_user_city: str
    new_user_zip: str


class VerificationStatusEmailData(_LocalizedEmailData):
    """Data for rendering verification status change emails."""

    user_first_name: str
    user_email: EmailStr
    new_status: str
    reason: Optional[str] = None
    app_url: Optional[str] = None
    how_it_works_video_url: Optional[str] = None


class BookingReminderEmailData(_LocalizedEmailData):
    """Data for the 30-minute booking reminder email."""

    user_first_name: str
    user_email: EmailStr
    verification_url: str


class BroadcastDigestEmailData(_LocalizedEmailData):
    """Data for rendering the broadcast digest email."""

    user_first_name: str
    user_email: EmailStr
    broadcast_title: str
    broadcast_body: str
    broadcast_link: Optional[str] = None


class PaymentReminderEmailData(_LocalizedEmailData):
    """Remind the debtor that a payment request is overdue."""

    user_first_name: str
    user_email: EmailStr
    creditor_name: str
    amount_time: int
    amount_regio: float
    description: Optional[str] = None
    days_pending: int


class PaymentEnforcedEmailData(_LocalizedEmailData):
    """Notify both parties that a payment was automatically executed by the system."""

    user_first_name: str
    user_email: EmailStr
    is_creditor: bool
    other_party_name: str
    amount_time: int
    amount_regio: float
    description: Optional[str] = None


class PaymentRequestRejectedEmailData(_LocalizedEmailData):
    """Notify the creditor that the debtor has rejected their payment request."""

    user_first_name: str
    user_email: EmailStr
    debtor_name: str
    amount_time: int
    amount_regio: float
    description: Optional[str] = None


class DisputeResolvedEmailData(_LocalizedEmailData):
    """Data for rendering the dispute resolution notification email."""

    user_first_name: str
    user_email: EmailStr
    is_creditor: bool  # True = creditor, False = debtor
    outcome: str  # "APPROVED" or "CANCELLED"
    admin_note: Optional[str] = None
    amount_time: int
    amount_regio: float
    description: Optional[str] = None


class PasswordResetEmailData(_LocalizedEmailData):
    """Data for rendering the password reset email."""

    user_first_name: str
    user_email: EmailStr
    reset_url: str


class EmailChangeNotifyData(_LocalizedEmailData):
    """Notification sent to the OLD email address when a change is requested."""

    user_first_name: str
    user_email: EmailStr  # old address — this is where the email is sent
    new_email: str


class EmailChangeConfirmData(_LocalizedEmailData):
    """Confirmation link sent to the NEW email address."""

    user_first_name: str
    user_email: EmailStr  # new address — this is where the email is sent
    confirm_url: str
