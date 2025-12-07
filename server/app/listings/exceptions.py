class ListingBaseException(Exception):
    """Base class for all listing module exceptions"""
    detail = "A listing error occurred."

    def __init__(self, detail: str = None):
        if detail:
            self.detail = detail
        super().__init__(self.detail)

# ==========================================
# Category: 404 Not Found
# ==========================================
class ListingNotFound(ListingBaseException):
    detail = "Listing not found"

class TagNotFound(ListingBaseException):
    detail = "Tag not found"

# ==========================================
# Category: 403 Forbidden
# ==========================================
class ListingNotOwned(ListingBaseException):
    detail = "You do not have permission to modify this listing"

# ==========================================
# Category: 400 Bad Request
# ==========================================
class InvalidListingData(ListingBaseException):
    """Base for 400 errors regarding listing data"""
    pass

class InvalidCategoryData(InvalidListingData):
    detail = "Missing or invalid attributes for this category"

class TagNotAllowed(InvalidListingData):
    detail = "Tag usage not allowed"
    