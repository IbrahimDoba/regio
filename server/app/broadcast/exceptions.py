class BroadcastBaseException(Exception):
    """Base class for all broadcast module exceptions"""

    detail = "A broadcast error occurred."

    def __init__(self, detail: str = None):
        if detail:
            self.detail = detail
        super().__init__(self.detail)


class BroadcastNotFound(BroadcastBaseException):
    detail = "Message not found or does not belong to user."
