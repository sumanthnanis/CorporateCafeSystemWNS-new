from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import verify_token

# Security scheme
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    token = credentials.credentials
    
    # Verify token
    payload = verify_token(token)
    
    # Get user from database
    username = payload.get("sub")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

async def get_current_cafe_owner(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is a cafe owner."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Cafe owner access required."
        )
    return current_user

async def get_current_employee(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is an employee."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Employee access required."
        )
    return current_user 