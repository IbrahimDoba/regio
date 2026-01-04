from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.listings.service import ListingService


def get_listing_service(session: SessionDep) -> ListingService:
    return ListingService(session)


ListingServiceDep = Annotated[ListingService, Depends(get_listing_service)]
