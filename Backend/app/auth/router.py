"""
Authentication router (API endpoints)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.schemas import UserCreate, UserLogin, UserResponse, Token
from app.auth.service import AuthService
from app.core.dependencies import get_current_user
from db.session import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user
    
    - **email**: Valid email address
    - **username**: Unique username (3-50 chars)
    - **password**: Password (min 6 chars)
    - **role**: User role (admin, analyst, viewer)
    """
    user = AuthService.create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
async def login(
    user_login: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login and get access token
    
    - **username**: Your username
    - **password**: Your password
    """
    user = AuthService.authenticate_user(db, user_login)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    access_token = AuthService.generate_token(user)
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get currently authenticated user information"""
    return current_user
