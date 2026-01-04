from typing import Annotated

from fastapi import Depends

from app.auth.service import AuthService
from app.core.database import SessionDep


def get_auth_service(session: SessionDep) -> AuthService:
    return AuthService(session)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
