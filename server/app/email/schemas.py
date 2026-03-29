from typing import Optional

from pydantic import BaseModel, EmailStr


class EmailMessage(BaseModel):
    """Internal schema representing a composed email ready to send."""

    to: EmailStr
    subject: str
    html_body: str
    plain_body: Optional[str] = None


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
