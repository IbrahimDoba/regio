from pydantic import Field

from app.base_config import RegioBaseSettings


class EmailConfig(RegioBaseSettings):
    """
    SMTP and email-related configuration.

    All values are loaded from the .env file.
    """

    SMTP_HOST: str = Field(description="SMTP server hostname.")
    SMTP_PORT: int = Field(default=587, description="SMTP server port.")
    SMTP_USERNAME: str = Field(description="SMTP authentication username.")
    SMTP_PASSWORD: str = Field(description="SMTP authentication password.")
    SMTP_FROM_ADDRESS: str = Field(
        description="Sender address for outgoing emails."
    )
    SMTP_USE_TLS: bool = Field(
        default=True, description="Whether to use STARTTLS."
    )

    CALENDLY_URL: str = Field(
        default="https://cal.regio.is",
        description="Video call booking URL for user verification calls.",
    )


email_settings = EmailConfig()
