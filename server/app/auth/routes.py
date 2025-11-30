from typing import Any, Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request
from fastapi.security import OAuth2PasswordRequestForm

from app.auth.utils import set_refresh_cookie
from app.auth.dependencies import AuthServiceDep
from app.auth.schemas import Token
from app.core.schemas import Message
from app.users.schemas import UserPublic
from app.users.dependencies import CurrentUser
from app.auth.exceptions import (
    InvalidCredentials, 
    AccountInactive, 
    InvalidToken,
    RefreshTokenExpired,
    AccountNotVerified
)

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    response: Response,
    service: AuthServiceDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Any:
    """
    Login: Returns Access Token in body, Refresh Token in HttpOnly Cookie.
    """

    try:
        token_data = await service.authenticate_user(form_data.username, form_data.password)
        
        # Set the Refresh Token in the cookie
        set_refresh_cookie(response, token_data.refresh_token)
        
        # Remove refresh_token from body response for security/cleanliness
        token_data.refresh_token = None 
        return token_data
    
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except AccountInactive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except AccountNotVerified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="User not verified",
            headers={"WWW-Authenticate": "Bearer"}
        )

@router.post("/login/test-token", response_model=UserPublic)
async def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user

@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    response: Response,
    request: Request,
    service: AuthServiceDep,
    refresh_token: Optional[str] = Cookie(None)
) -> Any:
    """
    Exchanges a valid Refresh Token (cookie) for a new Access Token & Refresh Token.
    Rotates the Refresh Token.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Refresh token missing"
        )

    try:
        new_tokens = await service.refresh_token(refresh_token)
        
        # Update the cookie with the NEW refresh token (Rotation)
        set_refresh_cookie(response, new_tokens.refresh_token)
        
        new_tokens.refresh_token = None
        return new_tokens
        
    except (InvalidToken, RefreshTokenExpired):
        # If rotation fails or token is bad, clear the cookie
        response.delete_cookie("refresh_token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired refresh token"
        )

@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    service: AuthServiceDep,
    refresh_token: Optional[str] = Cookie(None)
) -> Message:
    """
    Logout: Blacklists tokens and clears cookies.
    """
    # Attempt to extract access token from Authorization header
    auth_header = request.headers.get("Authorization")
    access_token = None
    if auth_header and auth_header.startswith("Bearer "):
        access_token = auth_header.split(" ")[1]

    if access_token:
        await service.logout(access_token, refresh_token)
    
    # Always clear cookie client-side
    response.delete_cookie("refresh_token")
    
    return Message(message="Logged out successfully")
