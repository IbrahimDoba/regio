class BankingException(Exception):
    pass

class InsufficientFunds(BankingException):
    def __init__(self, currency: str, balance: float, limit: float):
        self.message = f"Insufficient {currency} funds. Balance: {balance}, Limit: {limit}"
        super().__init__(self.message)

class AccountNotFound(BankingException):
    pass

class SelfTransferError(BankingException):
    pass

class InvalidTransactionAmount(BankingException):
    pass

class TransactionConflict(BankingException):
    """Raised when Optimistic Locking fails"""
    pass

class PaymentRequestNotPending(BankingException):
    pass

class UnauthorizedPaymentApproval(BankingException):
    pass
