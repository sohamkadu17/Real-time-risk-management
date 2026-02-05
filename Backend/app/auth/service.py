"""
Authentication service layer
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.auth.models import User
from app.auth.schemas import UserCreate, UserLogin
from app.core.security import verify_password, get_password_hash, create_access_token


class AuthService:
    """Service for authentication operations"""
    
    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        """
        Create a new user
        
        Args:
            db: Database session
            user_in: User creation data
            
        Returns:
            Created user
            
        Raises:
            HTTPException: If user already exists
        """
        # Check if user exists
        if db.query(User).filter(User.email == user_in.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        if db.query(User).filter(User.username == user_in.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create user
        db_user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            role=user_in.role
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def authenticate_user(db: Session, user_login: UserLogin) -> Optional[User]:
        """
        Authenticate a user
        
        Args:
            db: Database session
            user_login: Login credentials
            
        Returns:
            User if authenticated, None otherwise
        """
        user = db.query(User).filter(User.username == user_login.username).first()
        
        if not user:
            return None
        
        if not verify_password(user_login.password, user.hashed_password):
            return None
        
        return user
    
    @staticmethod
    def generate_token(user: User) -> str:
        """
        Generate JWT token for user
        
        Args:
            user: User model instance
            
        Returns:
            JWT access token
        """
        token_data = {"sub": user.id, "role": user.role}
        return create_access_token(token_data)
