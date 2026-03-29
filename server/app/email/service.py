import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
from jinja2 import Environment, FileSystemLoader

from app.email.config import email_settings
from app.email.exceptions import EmailSendFailed, EmailTemplateNotFound
from app.email.schemas import (
    BroadcastDigestEmailData,
    EmailMessage,
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

    def _render_template(self, template_name: str, context: dict) -> str:
        """Render a Jinja2 template file to an HTML string."""
        try:
            template = self.jinja_env.get_template(template_name)
        except Exception:
            raise EmailTemplateNotFound(
                f"Template '{template_name}' not found."
            )
        return template.render(**context)

    async def _send(self, message: EmailMessage) -> None:
        """
        Low-level async SMTP send.

        Constructs a MIME multipart message with HTML (and optional plain text)
        parts and delivers it via the configured SMTP server.
        """
        msg = MIMEMultipart("alternative")
        msg["From"] = self.config.SMTP_FROM_ADDRESS
        msg["To"] = message.to
        msg["Subject"] = message.subject

        if message.plain_body:
            msg.attach(MIMEText(message.plain_body, "plain"))
        msg.attach(MIMEText(message.html_body, "html"))

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
        )
        await self._send(message)


email_service = EmailService()
