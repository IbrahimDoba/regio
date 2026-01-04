from typing import Annotated

from fastapi import Depends

from app.chat.service import ChatService
from app.core.database import SessionDep


def get_chat_service(session: SessionDep) -> ChatService:
    return ChatService(session)


ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]
