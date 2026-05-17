from typing import Optional

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
    SMTP_REPLY_TO: Optional[str] = Field(
        default=None,
        description="Reply-To address. Falls back to SMTP_FROM_ADDRESS.",
    )
    SMTP_USE_TLS: bool = Field(
        default=True, description="Whether to use STARTTLS."
    )

    CALENDLY_URL: str = Field(
        default="https://cal.regio.is",
        description="Video call booking URL for user verification calls.",
    )

    BROADCAST_CHUNK_SIZE: int = Field(
        default=50,
        description="Recipients per broadcast send chunk before pacing pause.",
    )
    BROADCAST_CHUNK_DELAY_SECONDS: float = Field(
        default=2.0,
        description="Seconds to wait between broadcast chunks.",
    )
    BROADCAST_CONCURRENCY: int = Field(
        default=3,
        description="Concurrent SMTP sends within a single broadcast chunk.",
    )


email_settings = EmailConfig()
