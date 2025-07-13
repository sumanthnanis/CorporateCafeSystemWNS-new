from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os

from database import SessionLocal, engine, Base
from models import User, Cafe, Order, OrderFeedback, OrderItem, MenuItem, Category, UserType, OrderStatus
from middleware import get_current_user, get_current_super_admin
from auth import verify_token

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Admin Service", description="Super admin management service for company oversight")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for admin operations
class UserCreateAdmin(BaseModel):
    email: str
    username: str
    full_name: str
    password: str
    user_type: UserType

class UserUpdateAdmin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    user_type: Optional[UserType] = None
    is_active: Optional[bool] = None

class CafeCreateAdmin(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    owner_id: int

class CafeUpdateAdmin(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    owner_id: Optional[int] = None
    is_active: Optional[bool] = None

class MenuItemCreateAdmin(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    available_quantity: int
    max_daily_quantity: int
    is_available: bool = True
    preparation_time: int = 15
    cafe_id: int
    category_id: int

class MenuItemUpdateAdmin(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    available_quantity: Optional[int] = None
    max_daily_quantity: Optional[int] = None
    is_available: Optional[bool] = None
    preparation_time: Optional[int] = None
    category_id: Optional[int] = None

class SystemStats(BaseModel):
    total_users: int
    total_cafes: int
    total_menu_items: int
    total_orders: int
    total_feedbacks: int
    active_users: int
    active_cafes: int

@app.get("/")
async def root():
    return {"message": "Admin Service API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "admin-service"}

# System Overview
@app.get("/admin/stats", response_model=SystemStats)
async def get_system_stats(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get comprehensive system statistics."""
    return SystemStats(
        total_users=db.query(User).count(),
        total_cafes=db.query(Cafe).count(),
        total_menu_items=db.query(MenuItem).count(),
        total_orders=db.query(Order).count(),
        total_feedbacks=db.query(OrderFeedback).count(),
        active_users=db.query(User).filter(User.is_active == True).count(),
        active_cafes=db.query(Cafe).filter(Cafe.is_active == True).count()
    )

# User Management
@app.get("/admin/users")
async def get_all_users(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all users in the system."""
    users = db.query(User).all()
    return [{
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "user_type": user.user_type.value,
        "is_active": user.is_active,
        "created_at": user.created_at
    } for user in users]

@app.post("/admin/users")
async def create_user(
    user_data: UserCreateAdmin,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new user."""
    from auth import get_password_hash
    
    # Check if user already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        user_type=user_data.user_type,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "username": new_user.username,
        "full_name": new_user.full_name,
        "user_type": new_user.user_type.value,
        "is_active": new_user.is_active,
        "created_at": new_user.created_at
    }

@app.put("/admin/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdateAdmin,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Update a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if user_data.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        user.email = user_data.email
    
    if user_data.username is not None:
        # Check if username is already taken by another user
        existing_user = db.query(User).filter(User.username == user_data.username, User.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = user_data.username
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.user_type is not None:
        user.user_type = user_data.user_type
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "user_type": user.user_type.value,
        "is_active": user.is_active,
        "created_at": user.created_at
    }

@app.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Delete a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deletion of the current super admin
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

# Cafe Management
@app.get("/admin/cafes")
async def get_all_cafes(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all cafes in the system."""
    cafes = db.query(Cafe).all()
    return [{
        "id": cafe.id,
        "name": cafe.name,
        "description": cafe.description,
        "address": cafe.address,
        "phone": cafe.phone,
        "is_active": cafe.is_active,
        "owner_id": cafe.owner_id,
        "owner_name": cafe.owner.full_name if cafe.owner else None,
        "created_at": cafe.created_at,
        "menu_items_count": len(cafe.menu_items)
    } for cafe in cafes]

@app.post("/admin/cafes")
async def create_cafe(
    cafe_data: CafeCreateAdmin,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new cafe."""
    # Verify owner exists and is a cafe owner
    owner = db.query(User).filter(User.id == cafe_data.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    if owner.user_type != UserType.CAFE_OWNER:
        raise HTTPException(status_code=400, detail="User is not a cafe owner")
    
    new_cafe = Cafe(
        name=cafe_data.name,
        description=cafe_data.description,
        address=cafe_data.address,
        phone=cafe_data.phone,
        owner_id=cafe_data.owner_id,
        is_active=True
    )
    
    db.add(new_cafe)
    db.commit()
    db.refresh(new_cafe)
    
    return {
        "id": new_cafe.id,
        "name": new_cafe.name,
        "description": new_cafe.description,
        "address": new_cafe.address,
        "phone": new_cafe.phone,
        "is_active": new_cafe.is_active,
        "owner_id": new_cafe.owner_id,
        "owner_name": new_cafe.owner.full_name,
        "created_at": new_cafe.created_at
    }

@app.put("/admin/cafes/{cafe_id}")
async def update_cafe(
    cafe_id: int,
    cafe_data: CafeUpdateAdmin,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Update a cafe."""
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    
    # Update fields if provided
    if cafe_data.name is not None:
        cafe.name = cafe_data.name
    if cafe_data.description is not None:
        cafe.description = cafe_data.description
    if cafe_data.address is not None:
        cafe.address = cafe_data.address
    if cafe_data.phone is not None:
        cafe.phone = cafe_data.phone
    if cafe_data.is_active is not None:
        cafe.is_active = cafe_data.is_active
    
    if cafe_data.owner_id is not None:
        # Verify new owner exists and is a cafe owner
        owner = db.query(User).filter(User.id == cafe_data.owner_id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        if owner.user_type != UserType.CAFE_OWNER:
            raise HTTPException(status_code=400, detail="User is not a cafe owner")
        cafe.owner_id = cafe_data.owner_id
    
    db.commit()
    db.refresh(cafe)
    
    return {
        "id": cafe.id,
        "name": cafe.name,
        "description": cafe.description,
        "address": cafe.address,
        "phone": cafe.phone,
        "is_active": cafe.is_active,
        "owner_id": cafe.owner_id,
        "owner_name": cafe.owner.full_name,
        "created_at": cafe.created_at
    }

@app.delete("/admin/cafes/{cafe_id}")
async def delete_cafe(
    cafe_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Delete a cafe."""
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    
    # First delete all order items for orders from this cafe
    orders = db.query(Order).filter(Order.cafe_id == cafe_id).all()
    for order in orders:
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        for order_item in order_items:
            db.delete(order_item)
        # Delete feedbacks for this order
        feedbacks = db.query(OrderFeedback).filter(OrderFeedback.order_id == order.id).all()
        for feedback in feedbacks:
            db.delete(feedback)
        # Delete the order
        db.delete(order)
    
    # Delete all menu items associated with this cafe
    menu_items = db.query(MenuItem).filter(MenuItem.cafe_id == cafe_id).all()
    for item in menu_items:
        db.delete(item)
    
    # Delete all feedbacks associated with this cafe
    feedbacks = db.query(OrderFeedback).filter(OrderFeedback.cafe_id == cafe_id).all()
    for feedback in feedbacks:
        db.delete(feedback)
    
    # Finally delete the cafe
    db.delete(cafe)
    db.commit()
    
    return {"message": "Cafe and all associated data deleted successfully"}

# Menu Item Management
@app.get("/admin/menu-items")
async def get_all_menu_items(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all menu items across all cafes."""
    menu_items = db.query(MenuItem).all()
    return [{
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "available_quantity": item.available_quantity,
        "max_daily_quantity": item.max_daily_quantity,
        "is_available": item.is_available,
        "preparation_time": item.preparation_time,
        "cafe_id": item.cafe_id,
        "cafe_name": item.cafe.name if item.cafe else None,
        "category_id": item.category_id,
        "category_name": item.category.name if item.category else None,
        "created_at": item.created_at
    } for item in menu_items]

@app.post("/admin/menu-items")
async def create_menu_item(
    item_data: MenuItemCreateAdmin,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new menu item."""
    # Verify cafe exists
    cafe = db.query(Cafe).filter(Cafe.id == item_data.cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == item_data.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    new_item = MenuItem(
        name=item_data.name,
        description=item_data.description,
        price=item_data.price,
        available_quantity=item_data.available_quantity,
        max_daily_quantity=item_data.max_daily_quantity,
        is_available=item_data.is_available,
        preparation_time=item_data.preparation_time,
        cafe_id=item_data.cafe_id,
        category_id=item_data.category_id
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {
        "id": new_item.id,
        "name": new_item.name,
        "description": new_item.description,
        "price": new_item.price,
        "available_quantity": new_item.available_quantity,
        "max_daily_quantity": new_item.max_daily_quantity,
        "is_available": new_item.is_available,
        "preparation_time": new_item.preparation_time,
        "cafe_id": new_item.cafe_id,
        "cafe_name": new_item.cafe.name,
        "category_id": new_item.category_id,
        "category_name": new_item.category.name,
        "created_at": new_item.created_at
    }

@app.put("/admin/menu-items/{item_id}")
async def update_menu_item(
    item_id: int,
    item_data: MenuItemUpdateAdmin,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Update a menu item."""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Update fields if provided
    if item_data.name is not None:
        item.name = item_data.name
    if item_data.description is not None:
        item.description = item_data.description
    if item_data.price is not None:
        item.price = item_data.price
    if item_data.available_quantity is not None:
        item.available_quantity = item_data.available_quantity
    if item_data.max_daily_quantity is not None:
        item.max_daily_quantity = item_data.max_daily_quantity
    if item_data.is_available is not None:
        item.is_available = item_data.is_available
    if item_data.preparation_time is not None:
        item.preparation_time = item_data.preparation_time
    if item_data.category_id is not None:
        # Verify category exists
        category = db.query(Category).filter(Category.id == item_data.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        item.category_id = item_data.category_id
    
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    
    return {
        "id": item.id,
        "name": item.name,
        "description": item.description,
        "price": item.price,
        "available_quantity": item.available_quantity,
        "max_daily_quantity": item.max_daily_quantity,
        "is_available": item.is_available,
        "preparation_time": item.preparation_time,
        "cafe_id": item.cafe_id,
        "cafe_name": item.cafe.name,
        "category_id": item.category_id,
        "category_name": item.category.name,
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }

@app.delete("/admin/menu-items/{item_id}")
async def delete_menu_item(
    item_id: int,
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Delete a menu item."""
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Menu item deleted successfully"}

# Order Overview
@app.get("/admin/orders")
async def get_all_orders(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all orders in the system."""
    orders = db.query(Order).all()
    return [{
        "id": order.id,
        "order_number": order.order_number,
        "total_amount": order.total_amount,
        "status": order.status.value,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name if order.customer else None,
        "cafe_id": order.cafe_id,
        "cafe_name": order.cafe.name if order.cafe else None,
        "created_at": order.created_at,
        "updated_at": order.updated_at
    } for order in orders]

# Categories
@app.get("/admin/categories")
async def get_all_categories(
    current_user: User = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Get all categories."""
    categories = db.query(Category).all()
    return [{
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "created_at": category.created_at,
        "menu_items_count": len(category.menu_items)
    } for category in categories]

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("SERVICE_PORT", 8005))
    uvicorn.run(app, host="0.0.0.0", port=port)