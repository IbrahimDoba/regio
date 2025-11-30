from enum import StrEnum

class TrustLevel(StrEnum):
    T1 = "T1"  # Entry level
    T2 = "T2"
    T3 = "T3"
    T4 = "T4"
    T5 = "T5"
    T6 = "T6"  # Founder/System Sink level

class Language(StrEnum):
    EN = "EN"
    DE = "DE"
    HU = "HU"
