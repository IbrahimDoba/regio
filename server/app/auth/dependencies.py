from typing import Annotated

from fastapi import Depends
from app.core.database import SessionDep
from app.auth.service import AuthService

def get_auth_service(session: SessionDep) -> AuthService:
    return AuthService(session)

AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
