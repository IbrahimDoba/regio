class BankingException(Exception):
    """Base exception for banking module."""
    pass

class AccountNotFound(BankingException):
    def __init__(self, detail: str = "Account not found"):
        self.message = detail
        super().__init__(self.message)

class InvalidTransactionAmount(BankingException):
    def __init__(self, detail: str = "Transaction amount must be positive"):
        self.message = detail
        super().__init__(self.message)

class SelfTransferError(BankingException):
    def __init__(self):
        self.message = "Cannot transfer funds to yourself"
        super().__init__(self.message)

class InsufficientFunds(BankingException):
    def __init__(self, currency: str, current: float, limit: float):
        self.message = f"Insufficient {currency} funds. Current: {current}, Limit: {limit}"
        super().__init__(self.message)

class TransactionConflict(BankingException):
    """Raised when Optimistic Locking fails (concurrent updates)."""
    def __init__(self):
        self.message = "Transaction conflict detected. Please retry."
        super().__init__(self.message)

class PaymentRequestNotFound(BankingException):
    def __init__(self):
        self.message = "Payment request not found"
        super().__init__(self.message)

class InvalidPaymentRequestStatus(BankingException):
    def __init__(self, current_status: str):
        self.message = f"Payment request is {current_status}, cannot process."
        super().__init__(self.message)

class UnauthorizedPaymentRequestAccess(BankingException):
    def __init__(self):
        self.message = "You are not authorized to manage this payment request"
        super().__init__(self.message)
