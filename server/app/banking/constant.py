from decimal import Decimal
from app.users.enums import TrustLevel

TRUST_LIMITS = {
    TrustLevel.T1: (-60, Decimal("-10.00")),
    TrustLevel.T2: (-180, Decimal("-30.00")),
    TrustLevel.T3: (-300, Decimal("-50.00")),
    TrustLevel.T4: (-600, Decimal("-100.00")),
    TrustLevel.T5: (-900, Decimal("-150.00")),
    TrustLevel.T6: (-1200, Decimal("-200.00")),
}

TRUST_UPGRADE_THRESHOLDS = [
    # (TrustLevel.T6, 4500),
    (TrustLevel.T5, 3000),
    (TrustLevel.T4, 1500),
    (TrustLevel.T3, 900),
    (TrustLevel.T2, 300),
]
