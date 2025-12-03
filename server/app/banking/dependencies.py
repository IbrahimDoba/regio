from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.banking.service import BankingService

def get_banking_service(session: SessionDep) -> BankingService:
    return BankingService(session)

BankingServiceDep = Annotated[BankingService, Depends(get_banking_service)]
