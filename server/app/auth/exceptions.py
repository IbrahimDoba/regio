class AuthBaseException(Exception):
    """Base class for all auth module exceptions"""

    detail = "An authentication error occurred."

    def __init__(self, detail: str = None):
        # Use the passed detail, or fall back to the class default
        if detail:
            self.detail = detail
        super().__init__(self.detail)


# ==========================================
# Category: 401 Unauthorized
# ==========================================
class NotAuthorized(AuthBaseException):
    """Base for 401 errors (Authentication failed)"""

    pass


class InvalidCredentials(NotAuthorized):
    detail = "Incorrect email or password"


class InvalidToken(NotAuthorized):
    detail = "Token is invalid or expired"


class RefreshTokenExpired(NotAuthorized):
    detail = "Refresh token has expired"


# ==========================================
# Category: 403 Forbidden
# ==========================================
class PermissionDenied(AuthBaseException):
    """Base for 403 errors (Authenticated but not allowed)"""

    pass


class AccountNotVerified(PermissionDenied):
    detail = "Account exists but is not verified yet"


# ==========================================
# Category: 400 Bad Request
# ==========================================
class BadAuthRequest(AuthBaseException):
    """Base for 400 errors (Bad input)"""

    pass


class AccountInactive(BadAuthRequest):
    detail = "Inactive user account"


class InvalidInviteCode(BadAuthRequest):
    detail = "Invalid invite code"


class InviteCodeDepleted(BadAuthRequest):
    detail = "Invite code has no uses left"
