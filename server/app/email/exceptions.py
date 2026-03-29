class EmailBaseException(Exception):
    """Base class for all email module exceptions."""

    detail = "An email error occurred."

    def __init__(self, detail: str = None):
        if detail:
            self.detail = detail
        super().__init__(self.detail)


# ==========================================
# Category: Send Failures
# ==========================================


class EmailSendFailed(EmailBaseException):
    """Raised when an SMTP send operation fails."""

    detail = "Failed to send email via SMTP."


class EmailTemplateNotFound(EmailBaseException):
    """Raised when a Jinja2 template file cannot be loaded."""

    detail = "Email template not found."
