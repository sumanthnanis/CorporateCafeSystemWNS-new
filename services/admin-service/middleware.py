from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import os

from database import get_db
from models import User, UserType
from auth import verify_token

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception
        
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
            
        return user
    except Exception:
        raise credentials_exception

async def get_current_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is a super admin."""
    if current_user.user_type != UserType.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user

async def get_current_cafe_owner(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is a cafe owner."""
    if current_user.user_type != UserType.CAFE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cafe owner access required"
        )
    return current_user

async def get_current_employee(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is an employee."""
    if current_user.user_type != UserType.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access required"
        )
    return current_user