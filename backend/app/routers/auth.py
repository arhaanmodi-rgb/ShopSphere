from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import authenticate_user, create_user
from app.core.security import create_access_token
from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# USER REGISTRATION
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        user = create_user(
            db=db,
            name=user_data.name,
            email=user_data.email,
            password=user_data.password
        )
        return user
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )


# ============================================================
# JSON LOGIN (FOR FRONTEND CLIENTS)
# ============================================================

@router.post(
    "/login",
    response_model=Token,
    summary="Login with email and password (JSON)"
)
def login_json(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    user = authenticate_user(
        db=db,
        email=login_data.email,
        password=login_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "name": user.name,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


# ============================================================
# OAUTH2 FORM LOGIN (FOR FASTAPI SWAGGER UI AUTHORIZE)
# ============================================================

@router.post(
    "/token",
    response_model=Token,
    summary="OAuth2 Password token endpoint for Swagger UI"
)
def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "name": user.name,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


# ============================================================
# CURRENT USER PROFILE (/auth/me)
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current logged-in user profile"
)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user