from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.chat.service import ChatService


def get_chat_service(session: SessionDep) -> ChatService:
    return ChatService(session)


ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]
