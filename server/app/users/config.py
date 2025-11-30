from app.base_config import RegioBaseSettings

class UserConfig(RegioBaseSettings):
    SYSTEM_SINK_CODE: str
    SYSTEM_SINK_FIRST_NAME: str
    SYSTEM_SINK_LAST_NAME: str
    SYSTEM_SINK_EMAIL: str
    SYSTEM_SINK_PASSWORD: str

user_settings = UserConfig()
