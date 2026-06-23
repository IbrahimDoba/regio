import logging
import re
import uuid
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from html import unescape
from pathlib import Path

import aiosmtplib
import css_inline
from jinja2 import Environment, FileSystemLoader, TemplateNotFound

from app.email.config import email_settings
from app.email.exceptions import EmailSendFailed, EmailTemplateNotFound
from app.email.schemas import (
    BookingReminderEmailData,
    BroadcastDigestEmailData,
    DisputeResolvedEmailData,
    EmailChangeConfirmData,
    EmailChangeNotifyData,
    EmailMessage,
    PasswordResetEmailData,
    PaymentEnforcedEmailData,
    PaymentReminderEmailData,
    PaymentRequestRejectedEmailData,
    VerificationEmailData,
    VerificationStatusEmailData,
)

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).parent / "templates"

FROM_DISPLAY_NAME = "REGIO"

# Strips tags/scripts/styles and collapses whitespace. Good enough for
# transactional emails whose templates are simple — we don't need a full
# DOM parser here.
_HTML_TAG_RE = re.compile(r"<[^>]+>")
_HTML_SCRIPT_STYLE_RE = re.compile(
    r"<(script|style)[^>]*>.*?</\1>", re.DOTALL | re.IGNORECASE
)
_HTML_WHITESPACE_RE = re.compile(r"[ \t]+")
_HTML_NEWLINE_RE = re.compile(r"\n{3,}")


def _html_to_text(html: str) -> str:
    """Derive a plaintext alternative from rendered HTML."""
    text = _HTML_SCRIPT_STYLE_RE.sub("", html)
    # Preserve line structure where the original HTML used block tags
    text = re.sub(r"<\s*br\s*/?\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(
        r"</\s*(p|div|tr|li|h[1-6])\s*>",
        "\n",
        text,
        flags=re.IGNORECASE,
    )
    text = _HTML_TAG_RE.sub("", text)
    text = unescape(text)
    text = _HTML_WHITESPACE_RE.sub(" ", text)
    text = _HTML_NEWLINE_RE.sub("\n\n", text)
    return text.strip()


def _from_domain() -> str:
    """Parse the domain out of SMTP_FROM_ADDRESS for Message-ID generation."""
    address = email_settings.SMTP_FROM_ADDRESS
    if "@" in address:
        return address.rsplit("@", 1)[-1]
    return "regio.local"


class EmailService:
    """
    Stateless email service for composing and sending transactional emails.

    Uses Jinja2 for HTML template rendering and aiosmtplib for async SMTP
    delivery. Instantiated as a module-level singleton since it requires
    no database session — only SMTP configuration.
    """

    def __init__(self):
        self.config = email_settings
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(TEMPLATE_DIR)),
            autoescape=True,
        )
        self._logo_m = (TEMPLATE_DIR / "logo-M.png").read_bytes()
        self._logo_s = (TEMPLATE_DIR / "logo-S.png").read_bytes()

    def _render_template(self, template_name: str, context: dict) -> str:
        """Render a Jinja2 template to an HTML string with all CSS inlined."""
        try:
            template = self.jinja_env.get_template(template_name)
        except TemplateNotFound:
            raise EmailTemplateNotFound(
                f"Template '{template_name}' not found."
            )
        html = template.render(**context)
        return css_inline.inline(html)

    async def _send(self, message: EmailMessage) -> None:
        """
        Low-level async SMTP send.

        Builds a multipart/alternative (text + html) container, wraps it in
        multipart/related when inline images are present, and attaches the
        deliverability headers mailbox providers expect on modern senders.
        """
        plain_body = message.plain_body or _html_to_text(message.html_body)

        alternative = MIMEMultipart("alternative")
        alternative.attach(MIMEText(plain_body, "plain", "utf-8"))
        alternative.attach(MIMEText(message.html_body, "html", "utf-8"))

        if message.inline_images:
            msg = MIMEMultipart("related")
            msg.attach(alternative)
            for cid, data in message.inline_images.items():
                img = MIMEImage(data)
                img.add_header("Content-ID", f"<{cid}>")
                img.add_header("Content-Disposition", "inline", filename=cid)
                msg.attach(img)
        else:
            msg = alternative

        msg["From"] = formataddr(
            (FROM_DISPLAY_NAME, self.config.SMTP_FROM_ADDRESS)
        )
        msg["To"] = message.to
        msg["Subject"] = message.subject
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=_from_domain())
        msg["Reply-To"] = (
            self.config.SMTP_REPLY_TO or self.config.SMTP_FROM_ADDRESS
        )
        # Mark all programmatic mail as auto-generated so vacation responders
        # don't loop back into us and mailbox providers classify correctly.
        msg["Auto-Submitted"] = "auto-generated"
        msg["X-Auto-Response-Suppress"] = "All"
        # Stable ref for grouping inside ESP analytics; helps debugging blocks.
        msg["X-Entity-Ref-ID"] = str(uuid.uuid4())

        try:
            await aiosmtplib.send(
                msg,
                hostname=self.config.SMTP_HOST,
                port=self.config.SMTP_PORT,
                username=self.config.SMTP_USERNAME or None,
                password=self.config.SMTP_PASSWORD or None,
                use_tls=self.config.SMTP_SECURE,
            )
            logger.info(f"Email sent to {message.to}: {message.subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {message.to}: {e}")
            raise EmailSendFailed(f"SMTP error: {e}")

    # ------------------------------------------------------------------ #
    #  High-level email methods
    # ------------------------------------------------------------------ #

    async def send_welcome_email(self, data: VerificationEmailData) -> None:
        """Send registration welcome email with booking link."""
        html = self._render_template("welcome.html", data.model_dump())
        message = EmailMessage(
            to=data.user_email,
            subject="Welcome to Regio — Book Your Verification Call",
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_verification_status_email(
        self, data: VerificationStatusEmailData
    ) -> None:
        """Send email when a user's verification status changes."""
        subject_map = {
            "VERIFIED": "Your Regio Account Has Been Verified",
            "REJECTED": "Regio Account Verification Update",
            "ACTION_REQUIRED": "Action Required for Your Regio Account",
        }
        html = self._render_template(
            "verification_status.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject=subject_map.get(data.new_status, "Regio Account Update"),
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_payment_reminder_email(
        self, data: PaymentReminderEmailData
    ) -> None:
        """Remind a debtor that their payment request is overdue."""
        html = self._render_template(
            "payment_reminder.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject="Payment Reminder — Action Required on Regio",
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_payment_enforced_email(
        self, data: PaymentEnforcedEmailData
    ) -> None:
        """Notify a user their payment was automatically executed by the system."""
        subject = (
            "Your Payment Request Was Automatically Processed — Regio"
            if data.is_creditor
            else "Automatic Payment Processed From Your Account — Regio"
        )
        html = self._render_template(
            "payment_enforced.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject=subject,
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_payment_request_rejected_email(
        self, data: PaymentRequestRejectedEmailData
    ) -> None:
        """Notify the creditor that their payment request was declined by the debtor."""
        html = self._render_template(
            "request_rejected.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject="Your Payment Request Was Declined — Regio",
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_dispute_resolved_email(
        self, data: DisputeResolvedEmailData
    ) -> None:
        """Notify a user (creditor or debtor) that their dispute has been resolved."""
        subject = (
            "Your Dispute Has Been Resolved — Regio"
            if data.is_creditor
            else "Payment Dispute Update — Regio"
        )
        html = self._render_template(
            "dispute_resolved.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject=subject,
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_broadcast_digest_email(
        self, data: BroadcastDigestEmailData
    ) -> None:
        """Send broadcast content as an email digest to a single user."""
        html = self._render_template(
            "broadcast_digest.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject=f"Regio Update: {data.broadcast_title}",
            html_body=html,
            inline_images={"logo": self._logo_s},
        )
        await self._send(message)

    async def send_password_reset_email(
        self, data: PasswordResetEmailData
    ) -> None:
        """Send a password reset link to the user."""
        html = self._render_template("password_reset.html", data.model_dump())
        message = EmailMessage(
            to=data.user_email,
            subject="Reset Your Regio Password",
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_email_change_notify_email(
        self, data: EmailChangeNotifyData
    ) -> None:
        """Notify the OLD address that an email change has been requested."""
        html = self._render_template(
            "email_change_notify.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject="Your Regio email address is being changed",
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_email_change_confirm_email(
        self, data: EmailChangeConfirmData
    ) -> None:
        """Send confirmation link to the NEW address."""
        html = self._render_template(
            "email_change_confirm.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject="Confirm your new Regio email address",
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_booking_reminder_email(
        self, data: BookingReminderEmailData
    ) -> None:
        """Send a reminder to book the verification call (30 min after registration)."""
        html = self._render_template(
            "booking_reminder.html", data.model_dump()
        )
        message = EmailMessage(
            to=data.user_email,
            subject="Don't forget — Book your Regio verification call",
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)


email_service = EmailService()
