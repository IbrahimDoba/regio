from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    PostgresDsn,
    computed_field,
)
from pydantic_core import MultiHostUrl

# Import this
from app.base_config import RegioBaseSettings


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(RegioBaseSettings):
    SECRET_KEY: str
    # SECRET_KEY: str = secrets.token_urlsafe(32)

    FRONTEND_HOST: str = "http://localhost:3000"
    ENVIRONMENT: Literal["development", "staging", "production"]

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field
    @property
    def all_cors_origins(self) -> list[str]:
        # return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    PROJECT_NAME: str
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432

    REDIS_URL: str

    R2_BUCKET_NAME: str
    R2_ENDPOINT_URL: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str

    @computed_field
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
    SYSTEM_SINK_CODE: str
    SYSTEM_SINK_FIRST_NAME: str
    SYSTEM_SINK_LAST_NAME: str
    SYSTEM_SINK_EMAIL: str
    SYSTEM_SINK_PASSWORD: str


settings = Settings()
