from app.base_config import RegioBaseSettings


class ChatConfig(RegioBaseSettings):
    MATRIX_HOMESERVER_URL: str
    MATRIX_DOMAIN: str

    MATRIX_ADMIN_USER: str
    MATRIX_ADMIN_PASSWORD: str

    MATRIX_REGISTRATION_TOKEN: str
    MATRIX_ENCRYPTION_KEY: str


chat_settings = ChatConfig()
