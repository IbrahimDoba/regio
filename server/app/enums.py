from enum import Enum

class Currency(str, Enum):
    TIME = "TIME"
    REGIO = "REGIO"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"

class TrustLevel(str, Enum):
    T1 = "T1" # Entry level
    T2 = "T2"
    T3 = "T3"
    T4 = "T4"
    T5 = "T5" # Highest trust level
