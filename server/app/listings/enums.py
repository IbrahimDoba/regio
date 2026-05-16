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
    INACTIVE = "INACTIVE"  # Expired or manually deactivated
    SOLD = "SOLD"
    DELETED = "DELETED"


class DClass(StrEnum):
    D1 = "D1"  # Direct neighborhood — same ZIP only (0 km)
    D2 = "D2"  # Nearby area — up to 10 km
    D3 = "D3"  # Own region — up to 20 km
    D4 = "D4"  # Wider area — up to 40 km
    D5 = "D5"  # All Hungary — Nationwide (no geo filter)
    D6 = "D6"  # Digital / Remote help — Online (no geo filter)


# Max driving distance (km) for each local D-class.
# D5 and D6 have no geographic limit — they are not in this map.
D_CLASS_MAX_KM: dict[DClass, int] = {
    DClass.D1: 0,
    DClass.D2: 10,
    DClass.D3: 20,
    DClass.D4: 40,
}
