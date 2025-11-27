from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.routes import auth, users

# Main API router instance
api_router = APIRouter(
    prefix="/api",
    dependencies=[Depends(get_current_user)]
)

# Including all sub routers in the main router
api_router.include_router(router=auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(router=users.router, prefix="/users", tags=["users"])

# Health check endpoint
@api_router.get("/health-check")
def health_check():
    return True
