class UserAlreadyExists(Exception):
    pass

class UserNotFound(Exception):
    pass

class InvalidInviteCode(Exception):
    pass

class ImmutableFieldUpdate(Exception):
    """Raised when trying to edit a read-only field like Real Name."""
    pass

class SystemSaturated(Exception):
    """Raised when unique code generation fails repeatedly."""
    pass
