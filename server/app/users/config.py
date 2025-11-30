from pydantic_settings import BaseSettings, SettingsConfigDict

class UserConfig(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )
    
    # Initial super user config value
    SYSTEM_SINK_CODE: str
    SYSTEM_SINK_FIRST_NAME: str
    SYSTEM_SINK_LAST_NAME: str
    SYSTEM_SINK_EMAIL: str
    SYSTEM_SINK_PASSWORD: str

user_settings = UserConfig()  # type: ignore
