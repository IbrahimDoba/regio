from pydantic_settings import BaseSettings, SettingsConfigDict

class RegioBaseSettings(BaseSettings):
    """
    Common configuration for all settings classes.
    Defines how to read the .env file.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
