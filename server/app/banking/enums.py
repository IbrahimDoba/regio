from enum import StrEnum

class Currency(StrEnum):
    TIME = "TIME"
    REGIO = "REGIO"

class PaymentStatus(StrEnum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"
    
class TransactionType(StrEnum):
    OUTGOING = "OUTGOING"
    INCOMING = "INCOMING"
