from app.base_config import RegioBaseSettings


class AuthConfig(RegioBaseSettings):
    # Auth token configs
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 5
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ALGORITHM: str

    # Password reset
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    PASSWORD_RESET_BASE_URL: str = "http://localhost:3000/reset-password"


auth_settings = AuthConfig()
