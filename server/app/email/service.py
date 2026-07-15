import json
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
    AdminNewUserEmailData,
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
LOCALES_DIR = Path(__file__).parent / "locales"

FROM_DISPLAY_NAME = "REGIO"

# Languages with a translation catalog on disk; EN is the fallback for any
# missing language or key.
SUPPORTED_LANGUAGES = ("EN", "DE", "HU")
DEFAULT_LANGUAGE = "EN"

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
        # Per-language string catalogs, loaded once (keyed by upper-case code).
        self._locales = {
            lang: json.loads(
                (LOCALES_DIR / f"{lang.lower()}.json").read_text("utf-8")
            )
            for lang in SUPPORTED_LANGUAGES
        }

    def _t(self, email_key: str, language: str) -> dict:
        """Localized strings for one email, EN-fallback applied per key.

        Merges the target language's ``common`` + per-email sections over the
        English ones, so any string missing in DE/HU silently falls back to EN.
        """
        lang = (str(language) or DEFAULT_LANGUAGE).upper()
        english = self._locales[DEFAULT_LANGUAGE]
        localized = self._locales.get(lang, english)
        merged: dict = {}
        for source in (english, localized):
            merged.update(source.get("common", {}))
            merged.update(source.get(email_key, {}))
        return merged

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
                # STARTTLS only when explicitly enabled; otherwise force plain
                # SMTP (aiosmtplib's default None would opportunistically upgrade
                # if the server advertises support, which breaks a plain local
                # relay with an untrusted cert). Never both — guarded in
                # EmailConfig.
                start_tls=(
                    None
                    if self.config.SMTP_SECURE
                    else self.config.SMTP_STARTTLS
                ),
            )
            logger.info(f"Email sent to {message.to}: {message.subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {message.to}: {e}")
            raise EmailSendFailed(f"SMTP error: {e}") from e

    # ------------------------------------------------------------------ #
    #  High-level email methods
    # ------------------------------------------------------------------ #

    async def send_welcome_email(self, data: VerificationEmailData) -> None:
        """Send registration welcome email with booking link."""
        t = self._t("welcome", data.language)
        html = self._render_template(
            "welcome.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=t["subject"],
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_admin_new_user_email(
        self, data: AdminNewUserEmailData
    ) -> None:
        """Notify the system admin that a new user registered (pending verification)."""
        t = self._t("admin_new_user", data.language)
        html = self._render_template(
            "admin_new_user.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.admin_email,
            subject=t["subject"].format(
                name=data.new_user_name, code=data.new_user_code
            ),
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_verification_status_email(
        self, data: VerificationStatusEmailData
    ) -> None:
        """Send email when a user's verification status changes."""
        t = self._t("verification_status", data.language)
        subjects = t["subject"]
        html = self._render_template(
            "verification_status.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=subjects.get(data.new_status, subjects["DEFAULT"]),
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_payment_reminder_email(
        self, data: PaymentReminderEmailData
    ) -> None:
        """Remind a debtor that their payment request is overdue."""
        t = self._t("payment_reminder", data.language)
        html = self._render_template(
            "payment_reminder.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=t["subject"],
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_payment_enforced_email(
        self, data: PaymentEnforcedEmailData
    ) -> None:
        """Notify a user their payment was automatically executed by the system."""
        t = self._t("payment_enforced", data.language)
        subject = t["subject"]["creditor" if data.is_creditor else "debtor"]
        html = self._render_template(
            "payment_enforced.html", {**data.model_dump(), "t": t}
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
        t = self._t("request_rejected", data.language)
        html = self._render_template(
            "request_rejected.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=t["subject"],
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_dispute_resolved_email(
        self, data: DisputeResolvedEmailData
    ) -> None:
        """Notify a user (creditor or debtor) that their dispute has been resolved."""
        t = self._t("dispute_resolved", data.language)
        subject = t["subject"]["creditor" if data.is_creditor else "debtor"]
        html = self._render_template(
            "dispute_resolved.html", {**data.model_dump(), "t": t}
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
        t = self._t("broadcast_digest", data.language)
        html = self._render_template(
            "broadcast_digest.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=t["subject"].format(title=data.broadcast_title),
            html_body=html,
            inline_images={"logo": self._logo_s},
        )
        await self._send(message)

    async def send_password_reset_email(
        self, data: PasswordResetEmailData
    ) -> None:
        """Send a password reset link to the user."""
        t = self._t("password_reset", data.language)
        html = self._render_template(
            "password_reset.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=t["subject"],
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_email_change_notify_email(
        self, data: EmailChangeNotifyData
    ) -> None:
        """Notify the OLD address that an email change has been requested."""
        t = self._t("email_change_notify", data.language)
        html = self._render_template(
            "email_change_notify.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=t["subject"],
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_email_change_confirm_email(
        self, data: EmailChangeConfirmData
    ) -> None:
        """Send confirmation link to the NEW address."""
        t = self._t("email_change_confirm", data.language)
        html = self._render_template(
            "email_change_confirm.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=t["subject"],
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_booking_reminder_email(
        self, data: BookingReminderEmailData
    ) -> None:
        """Send a reminder to book the verification call (30 min after registration)."""
        t = self._t("booking_reminder", data.language)
        html = self._render_template(
            "booking_reminder.html", {**data.model_dump(), "t": t}
        )
        message = EmailMessage(
            to=data.user_email,
            subject=t["subject"],
            html_body=html,
            inline_images={"logo": self._logo_m},
        )
        await self._send(message)

    async def send_test_email(self, to: str) -> None:
        """Minimal SMTP connectivity check; failures propagate to the caller."""
        message = EmailMessage(
            to=to,
            subject="Regio SMTP test",
            html_body=(
                "<p>Regio SMTP connectivity test — if you got this, "
                "outbound email is working.</p>"
            ),
        )
        await self._send(message)


email_service = EmailService()
