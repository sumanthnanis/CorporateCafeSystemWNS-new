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

# Menu item schemas
class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    max_daily_quantity: int
    preparation_time: int = 15
    cafe_id: int
    category_id: int

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

# Response schemas
class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class MenuItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    available_quantity: int
    max_daily_quantity: int
    is_available: bool
    preparation_time: int
    cafe_id: int
    category_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True