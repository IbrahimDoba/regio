class ListingException(Exception):
    pass

class InvalidCategoryData(ListingException):
    """Raised when category specific fields are missing"""
    pass

# class TagNotAllowed(ListingException):
#     """Raised when trying to use a tag that isn't official yet"""
#     pass

class ListingNotFound(ListingException):
    pass

class ListingNotOwned(ListingException):
    pass
