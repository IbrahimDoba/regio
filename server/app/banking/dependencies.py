from typing import Annotated

from fastapi import Depends

from app.banking.service import BankingService
from app.core.database import SessionDep


def get_banking_service(session: SessionDep) -> BankingService:
    return BankingService(session)


BankingServiceDep = Annotated[BankingService, Depends(get_banking_service)]
