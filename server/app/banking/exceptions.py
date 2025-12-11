class BankingBaseException(Exception):
    """Base class for all banking module exceptions"""

    detail = "A banking error occurred."

    def __init__(self, detail: str = None):
        if detail:
            self.detail = detail
        super().__init__(self.detail)


# ==========================================
# Category: 404 Not Found
# ==========================================
class BankingNotFound(BankingBaseException):
    """Base for 404 errors in banking"""

    pass


class AccountNotFound(BankingNotFound):
    detail = "Account not found"


class PaymentRequestNotFound(BankingNotFound):
    detail = "Payment request not found"


# ==========================================
# Category: 400 Bad Request
# ==========================================
class BankingBadRequest(BankingBaseException):
    """Base for 400 errors (Bad Input / Business Logic)"""

    pass


class InvalidTransactionAmount(BankingBadRequest):
    detail = "Transaction amount must be positive"


class SelfTransferError(BankingBadRequest):
    detail = "Cannot transfer funds to yourself"


class InsufficientFunds(BankingBadRequest):
    def __init__(self, currency: str, current: float, limit: float):
        detail = f"Insufficient {currency} funds. Current: {current}, Limit: {limit}"
        super().__init__(detail)


class InvalidPaymentRequestStatus(BankingBadRequest):
    def __init__(self, current_status: str):
        detail = f"Payment request is {current_status}, cannot process."
        super().__init__(detail)


class InvalidPaymentAction(BankingBadRequest):
    detail = "Invalid action performed on payment request"


# ==========================================
# Category: 403 Forbidden
# ==========================================
class BankingForbidden(BankingBaseException):
    """Base for 403 errors (Auth/Permission issues in banking)"""

    pass


class UnauthorizedPaymentRequestAccess(BankingForbidden):
    detail = "You are not authorized to manage this payment request"


# ==========================================
# Category: 409 Conflict
# ==========================================
class BankingConflict(BankingBaseException):
    """Base for 409 errors (Concurrency)"""

    pass


class TransactionConflict(BankingConflict):
    detail = "Transaction conflict detected. Please retry."
