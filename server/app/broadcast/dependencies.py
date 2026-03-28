from typing import Annotated

from fastapi import Depends

from app.broadcast.service import BroadcastService
from app.core.database import SessionDep


def get_broadcast_service(session: SessionDep) -> BroadcastService:
    return BroadcastService(session)


BroadcastServiceDep = Annotated[
    BroadcastService, Depends(get_broadcast_service)
]
