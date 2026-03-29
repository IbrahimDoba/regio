from typing import Annotated

from fastapi import Depends

from app.email.service import EmailService, email_service


def get_email_service() -> EmailService:
    """Dependency to get the module-level EmailService singleton."""
    return email_service


EmailServiceDep = Annotated[EmailService, Depends(get_email_service)]
