from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.banking.exceptions import (
    BankingNotFound,
    BankingBadRequest,
    BankingForbidden,
    BankingConflict,
)


async def banking_not_found_handler(request: Request, exc: BankingNotFound):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": exc.detail},
    )


async def banking_bad_request_handler(request: Request, exc: BankingBadRequest):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": exc.detail},
    )


async def banking_forbidden_handler(request: Request, exc: BankingForbidden):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": exc.detail},
    )


async def banking_conflict_handler(request: Request, exc: BankingConflict):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": exc.detail},
    )
