from typing import Annotated

from fastapi import Depends

from app.admin.service import AdminService
from app.core.database import SessionDep
from app.users.dependencies import get_current_active_system_admin
from app.users.models import User

AdminUser = Annotated[User, Depends(get_current_active_system_admin)]


def get_admin_service(session: SessionDep) -> AdminService:
    return AdminService(session)


AdminServiceDep = Annotated[AdminService, Depends(get_admin_service)]
