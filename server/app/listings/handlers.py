from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.listings.exceptions import ListingNotFound, ListingNotOwned, InvalidListingData


async def listing_not_found_handler(request: Request, exc: ListingNotFound):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )


async def listing_permission_handler(request: Request, exc: ListingNotOwned):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.detail},
    )


async def invalid_listing_data_handler(request: Request, exc: InvalidListingData):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.detail},
    )
