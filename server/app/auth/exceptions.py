class InvalidCredentials(Exception):
    pass

class AccountInactive(Exception):
    pass

class InvalidToken(Exception):
    pass

class RefreshTokenExpired(Exception):
    pass

class InvalidInviteCode(Exception):
    pass

class InviteCodeDepleted(Exception):
    pass
