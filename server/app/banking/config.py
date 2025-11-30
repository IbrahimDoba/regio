from app.base_config import RegioBaseSettings

class BankingConfig(RegioBaseSettings):
    SYSTEM_SINK_CODE: str
    

banking_settings = BankingConfig()