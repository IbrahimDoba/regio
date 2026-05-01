from enum import StrEnum


class ListingCategory(StrEnum):
    OFFER_SERVICE = "OFFER_SERVICE"  # Green, Hand
    SEARCH_SERVICE = "SEARCH_SERVICE"  # Red, Magnifier
    SELL_PRODUCT = "SELL_PRODUCT"  # Blue, Package
    SEARCH_PRODUCT = "SEARCH_PRODUCT"  # Orange, Search Pkg
    OFFER_RENTAL = "OFFER_RENTAL"  # Violet, Swap
    RIDE_SHARE = "RIDE_SHARE"  # Turquoise, Car
    EVENT_WORKSHOP = "EVENT_WORKSHOP"  # Yellow, Calendar


class ListingStatus(StrEnum):
    ACTIVE = "ACTIVE"
    SOLD = "SOLD"
    DELETED = "DELETED"


class RadiusFilter(StrEnum):
    KM_5 = "5km"
    KM_10 = "10km"
    KM_25 = "25km"
    KM_50 = "50km"
    KM_100 = "100km"
    NATIONWIDE = "nationwide"


# Maps each RadiusFilter to its integer km value for DB filtering.
# NATIONWIDE is intentionally absent — it means no radius constraint.
RADIUS_FILTER_KM: dict[RadiusFilter, int] = {
    RadiusFilter.KM_5: 5,
    RadiusFilter.KM_10: 10,
    RadiusFilter.KM_25: 25,
    RadiusFilter.KM_50: 50,
    RadiusFilter.KM_100: 100,
}
