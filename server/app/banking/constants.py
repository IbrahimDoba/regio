from decimal import Decimal
from typing import Dict, Tuple

from app.users.enums import TrustLevel

# FEES & DEMURRAGE
MONTHLY_FEE_MINUTES = 30
DEMURRAGE_THRESHOLD_MINUTES = 1800
DEMURRAGE_RATE_ANNUAL = 0.06

# TRUST LIMITS
# Format: {TrustLevel: (TIME_MIN, REGIO_MIN_DECIMAL)}
# Example: T1 can go down to -60 Minutes and -10.00 Regio
TRUST_LIMITS: Dict[TrustLevel, Tuple[int, Decimal]] = {
    TrustLevel.T1: (-60, Decimal("-10.00")),
    TrustLevel.T2: (-180, Decimal("-30.00")),
    TrustLevel.T3: (-300, Decimal("-50.00")),
    TrustLevel.T4: (-600, Decimal("-100.00")),
    TrustLevel.T5: (-900, Decimal("-150.00")),
    TrustLevel.T6: (-1200, Decimal("-200.00")),
}

TRUST_UPGRADE_THRESHOLDS = [
    (TrustLevel.T5, 3000),
    (TrustLevel.T4, 1500),
    (TrustLevel.T3, 900),
    (TrustLevel.T2, 300),
]
