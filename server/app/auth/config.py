import os

from app.base_config import RegioBaseSettings

class AuthConfig(RegioBaseSettings):
    # Auth token configs
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 5
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    ALGORITHM: str

auth_settings = AuthConfig()
