from datetime import timedelta
from typing import Annotated, Any
from typing_extensions import Annotated

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException, status

from app.crud import users_crud
from app.core import security
from app.core.config import settings
from app.models.users import UserPublic
from app.models.system import Token
from app.api.deps import SessionDep, CurrentUser


router = APIRouter()

@router.post("/login/access-token")
async def login(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token for user authentication; get an access token for future requests.
    Form data fields are to be named username and password appropriately.
    """

    # Attempt to authenticate user
    user = await users_crud.authenticate(
        session=session,
        email=form_data.username, 
        password=form_data.password
    )

    # Error message instead of user returned
    if isinstance(user, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=user,
            headers={"WWW-Authenticate": "Bearer"}
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="User is inactive",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            subject=user.id, 
            expires_delta=access_token_expires
        )
    )


@router.post("/login/test-token", response_model=UserPublic)
async def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user

# @router.post("/password-recovery/{email}")
# def recover_password(email: str, session: SessionDep) -> Message:
#     """
#     Password Recovery
#     """
#     user = crud.get_user_by_email(session=session, email=email)

#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="The user with this email does not exist in the system",
#         )
#     password_reset_token = generate_password_reset_token(email=email)
#     email_data = generate_reset_password_email(
#         email_to=user.email, email=email, token=password_reset_token
#     )
#     send_email(
#         email_to=user.email,
#         subject=email_data.subject,
#         html_content=email_data.html_content,
#     )
#     return Message(message="Password recovery email sent")

# @router.post("/reset-password")
# def reset_password(session: SessionDep, body: NewPassword) -> Message:
#     """
#     Reset password
#     """
#     email = verify_password_reset_token(token=body.token)
#     if not email:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
#     user = crud.get_user_by_email(session=session, email=email)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="The user with this email does not exist in the system",
#         )
#     elif not user.is_active:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
#     hashed_password = get_password_hash(password=body.new_password)
#     user.hashed_password = hashed_password
#     session.add(user)
#     session.commit()
#     return Message(message="Password updated successfully")
