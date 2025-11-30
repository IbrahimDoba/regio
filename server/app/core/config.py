import os
from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    PostgresDsn,
    computed_field,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    # TODO: temporary key for prod to prevent jwt signature mismatch during development
    SECRET_KEY: str = 'adkSDK8984**493((_))ddDdsk8dLDKKDF9939DKkfadjkjzppeikfllx9334EE'
    # SECRET_KEY: str = secrets.token_urlsafe(32)

    FRONTEND_HOST: str = "http://localhost:3000"
    ENVIRONMENT: Literal["development", "staging", "production"] = os.getenv("ENVIRONMENT", "development")

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        # return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]


    PROJECT_NAME: str = os.getenv("PROJECT_NAME")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB")
    POSTGRES_PORT: int = 5432

    REDIS_URL: str = os.getenv("REDIS_URL")

    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME")
    R2_ENDPOINT_URL: str = os.getenv("R2_ENDPOINT_URL")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def DATABASE_URL(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )
    
    # Initial super user config value
    SYSTEM_SINK_CODE: str = os.getenv("SYSTEM_SINK_CODE")
    SYSTEM_SINK_FIRST_NAME: str = os.getenv("SYSTEM_SINK_FIRST_NAME")
    SYSTEM_SINK_LAST_NAME: str = os.getenv("SYSTEM_SINK_LAST_NAME")
    SYSTEM_SINK_EMAIL: str = os.getenv("SYSTEM_SINK_EMAIL")
    SYSTEM_SINK_PASSWORD: str = os.getenv("SYSTEM_SINK_PASSWORD")

settings = Settings()
