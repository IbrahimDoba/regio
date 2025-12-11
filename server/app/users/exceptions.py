class UserBaseException(Exception):
    """Base class for all user module exceptions"""

    detail = "A user error occurred."

    def __init__(self, detail: str = None):
        if detail:
            self.detail = detail
        super().__init__(self.detail)


# ==========================================
# Category: 404 Not Found
# ==========================================
class ResourceNotFound(UserBaseException):
    """Base for 404 errors"""

    pass


class UserNotFound(ResourceNotFound):
    detail = "User not found"


# ==========================================
# Category: 409 Conflict
# ==========================================
class ResourceConflict(UserBaseException):
    """Base for 409 errors"""

    pass


class UserAlreadyExists(ResourceConflict):
    detail = "Email already taken"


# ==========================================
# Category: 400 Bad Request
# ==========================================
class InvalidUserRequest(UserBaseException):
    """Base for 400 errors"""

    pass


class ImmutableFieldUpdate(InvalidUserRequest):
    detail = "Cannot update real names or other protected fields"


# ==========================================
# Category: 403 Forbidden
# ==========================================
class AccessDenied(UserBaseException):
    """Base for 403 errors"""

    pass


class ActionNotPermitted(AccessDenied):
    detail = "You do not have permission to perform this action"


# ==========================================
# Category: 500 Internal Server Error
# ==========================================
class SystemFailure(UserBaseException):
    """Base for 500 errors"""

    pass


class SystemSaturated(SystemFailure):
    detail = "System capacity reached, failed to generate unique user code"
