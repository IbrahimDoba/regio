import logging
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
import css_inline
from jinja2 import Environment, FileSystemLoader, TemplateNotFound

from app.email.config import email_settings
from app.email.exceptions import EmailSendFailed, EmailTemplateNotFound
from app.email.schemas import (
    BroadcastDigestEmailData,
    DisputeResolvedEmailData,
    EmailMessage,
    PaymentRequestRejectedEmailData,
    VerificationEmailData,
    VerificationStatusEmailData,
)

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).parent / "templates"


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

        Constructs a MIME multipart message with HTML (and optional plain text)
        parts and delivers it via the configured SMTP server.
        """
        alternative = MIMEMultipart("alternative")
        if message.plain_body:
            alternative.attach(MIMEText(message.plain_body, "plain"))
        alternative.attach(MIMEText(message.html_body, "html"))

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

        msg["From"] = self.config.SMTP_FROM_ADDRESS
        msg["To"] = message.to
        msg["Subject"] = message.subject

        try:
            await aiosmtplib.send(
                msg,
                hostname=self.config.SMTP_HOST,
                port=self.config.SMTP_PORT,
                username=self.config.SMTP_USERNAME,
                password=self.config.SMTP_PASSWORD,
                use_tls=self.config.SMTP_USE_TLS,
            )
            logger.info(f"Email sent to {message.to}: {message.subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {message.to}: {e}")
            raise EmailSendFailed(f"SMTP error: {e}")

    # ------------------------------------------------------------------ #
    #  High-level email methods
    # ------------------------------------------------------------------ #

    async def send_welcome_email(self, data: VerificationEmailData) -> None:
        """Send registration welcome email with Calendly booking link."""
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

    async def send_payment_request_rejected_email(
        self, data: PaymentRequestRejectedEmailData
    ) -> None:
        """Notify the creditor that their payment request was declined by the debtor."""
        html = self._render_template("request_rejected.html", data.model_dump())
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
        html = self._render_template("dispute_resolved.html", data.model_dump())
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


email_service = EmailService()
