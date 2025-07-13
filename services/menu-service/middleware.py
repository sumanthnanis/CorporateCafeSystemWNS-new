from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserType
from auth import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get current authenticated user."""
    payload = verify_token(token)
    username = payload.get("sub")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    return user

async def get_current_cafe_owner(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is a cafe owner."""
    if current_user.user_type.value != UserType.CAFE_OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Cafe owner privileges required."
        )
    return current_user

async def get_current_employee(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is an employee."""
    if current_user.user_type.value != UserType.EMPLOYEE.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee privileges required."
        )
    return current_user