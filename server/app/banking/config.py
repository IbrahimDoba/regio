from app.base_config import RegioBaseSettings


class BankingConfig(RegioBaseSettings):
    SYSTEM_SINK_CODE: str
    MONTHLY_FEE_MINUTES: int = 30
    DEMURRAGE_THRESHOLD_MINUTES: int = 1800
    DEMURRAGE_RATE_ANNUAL: float = 0.06


banking_settings = BankingConfig()
