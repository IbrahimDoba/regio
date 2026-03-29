from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep


def get_db_session(session: SessionDep):
    return session


DbSessionDep = Annotated[SessionDep, Depends(get_db_session)]
