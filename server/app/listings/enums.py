from enum import StrEnum


class ListingCategory(StrEnum):
    OFFER_SERVICE = "OFFER_SERVICE"  # Green, Hand
    SEARCH_SERVICE = "SEARCH_SERVICE"  # Red, Magnifier
    SELL_PRODUCT = "SELL_PRODUCT"  # Blue, Package
    SEARCH_PRODUCT = "SEARCH_PRODUCT"  # Orange, Search Pkg
    OFFER_RENTAL = "OFFER_RENTAL"  # Violet, Swap
    RIDE_SHARE = "RIDE_SHARE"  # Turquoise, Car
    EVENT_WORKSHOP = "EVENT_WORKSHOP"  # Yellow, Calendar


class RentalStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    LENT = "LENT"


class RideMode(StrEnum):
    ONE_TIME = "ONE_TIME"
    RECURRING = "RECURRING"


class ListingStatus(StrEnum):
    ACTIVE = "ACTIVE"
    SOLD = "SOLD"
    DELETED = "DELETED"
