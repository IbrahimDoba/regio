from typing import Annotated, Any, Literal
from urllib.parse import quote

from pydantic import (
    AliasChoices,
    AnyUrl,
    BeforeValidator,
    Field,
    PostgresDsn,
    computed_field,
)
from pydantic_core import MultiHostUrl

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

    BACKEND_URL: str = "http://localhost:8000"
    ENVIRONMENT: Literal["development", "staging", "production"]

    FRONTEND_HOSTS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []
    BACKEND_CORS_ORIGIN_REGEX: str = ""

    @computed_field
    @property
    def all_cors_origins(self) -> list[str]:
        return [
            str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS
        ] + [str(origin).rstrip("/") for origin in self.FRONTEND_HOSTS]

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
            username=quote(self.POSTGRES_USER, safe=""),
            password=quote(self.POSTGRES_PASSWORD, safe=""),
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    # Matrix homeserver integration
    # Accepts either MATRIX_HOMESERVER_URL or MATRIX_HOMESERVER env var
    MATRIX_HOMESERVER: str = Field(
        default="https://matrix.151.hu",
        validation_alias=AliasChoices(
            "MATRIX_HOMESERVER_URL", "MATRIX_HOMESERVER"
        ),
    )
    MATRIX_DOMAIN: str = "151.hu"
    MATRIX_REGISTRATION_TOKEN: str = ""
    # Admin credentials — access token is fetched at runtime via login
    MATRIX_ADMIN_USER: str = ""
    MATRIX_ADMIN_PASSWORD: str = ""
    MATRIX_ENCRYPTION_KEY: str = ""  # base64url-encoded 32-byte key

    # OpenAI
    DEEPSEEK_API_KEY: str = ""
    # Initial super user config value
    SYSTEM_SINK_CODE: str
    SYSTEM_SINK_FIRST_NAME: str
    SYSTEM_SINK_LAST_NAME: str
    SYSTEM_SINK_EMAIL: str
    SYSTEM_SINK_PASSWORD: str


settings = Settings()
