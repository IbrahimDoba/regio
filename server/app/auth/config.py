import os

from pydantic_settings import BaseSettings, SettingsConfigDict

class AuthConfig(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    # Auth token configs
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 5
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ALGORITHM: str = os.getenv("ALGORITHM")

auth_settings = AuthConfig()
