from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

class UserType(str, Enum):
    CAFE_OWNER = "CAFE_OWNER"
    EMPLOYEE = "EMPLOYEE"

class OrderStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    PREPARING = "PREPARING"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    user_type: UserType

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse