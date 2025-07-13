import os
import uvicorn
import requests
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import get_db, engine
from models import Base, User, Cafe, UserType, Order, OrderItem, OrderStatus
from schemas import UserType as UserTypeSchema
from middleware import get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cafe Management Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:5001")

# Pydantic models for requests
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CafeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

class CafeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    is_active: bool
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

async def verify_cafe_owner(current_user_data: dict) -> bool:
    """Verify if user is a cafe owner."""
    return current_user_data.get("user_type") == "CAFE_OWNER"

async def get_current_cafe_owner(current_user: User = Depends(get_current_user)) -> User:
    """Ensure current user is a cafe owner."""
    if current_user.user_type.value != UserType.CAFE_OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Cafe owner privileges required."
        )
    return current_user

@app.get("/")
async def root():
    return {"message": "Cafe Management Service", "service": "cafes", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cafe-management"}

@app.post("/cafes", response_model=CafeResponse)
async def create_cafe(
    cafe_data: CafeCreate,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Create a new cafe."""
    # Check if cafe name already exists for this owner
    existing_cafe = db.query(Cafe).filter(
        Cafe.name == cafe_data.name,
        Cafe.owner_id == current_user.id
    ).first()
    
    if existing_cafe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a cafe with this name"
        )
    
    # Create new cafe
    db_cafe = Cafe(
        name=cafe_data.name,
        description=cafe_data.description,
        address=cafe_data.address,
        phone=cafe_data.phone,
        owner_id=current_user.id
    )
    
    db.add(db_cafe)
    db.commit()
    db.refresh(db_cafe)
    
    return CafeResponse.model_validate(db_cafe)

@app.get("/cafes", response_model=List[CafeResponse])
async def get_my_cafes(
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Get all cafes owned by current user."""
    cafes = db.query(Cafe).filter(Cafe.owner_id == current_user.id).all()
    return [CafeResponse.model_validate(cafe) for cafe in cafes]

@app.get("/cafes/{cafe_id}", response_model=CafeResponse)
async def get_cafe(
    cafe_id: int,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Get a specific cafe."""
    cafe = db.query(Cafe).filter(
        Cafe.id == cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found or access denied"
        )
    
    return CafeResponse.model_validate(cafe)

@app.get("/cafes/public/all", response_model=List[CafeResponse])
async def get_all_active_cafes(db: Session = Depends(get_db)):
    """Get all active cafes (public endpoint for employees)."""
    cafes = db.query(Cafe).filter(Cafe.is_active == True).all()
    return [CafeResponse.model_validate(cafe) for cafe in cafes]

@app.put("/cafes/{cafe_id}", response_model=CafeResponse)
async def update_cafe(
    cafe_id: int,
    cafe_data: CafeCreate,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Update a cafe."""
    cafe = db.query(Cafe).filter(
        Cafe.id == cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found or access denied"
        )
    
    # Update cafe fields
    for field, value in cafe_data.dict(exclude_unset=True).items():
        setattr(cafe, field, value)
    
    db.commit()
    db.refresh(cafe)
    
    return CafeResponse.model_validate(cafe)

# Orders endpoint for cafe owners
@app.get("/orders")
async def get_cafe_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all orders for cafes owned by the current user."""
    if current_user.user_type != UserType.CAFE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only cafe owners can view orders"
        )
    
    # Get all orders for cafes owned by this user
    orders = db.query(Order).join(Cafe).filter(
        Cafe.owner_id == current_user.id
    ).all()
    
    # Format the orders with cafe information
    formatted_orders = []
    for order in orders:
        order_items = []
        for item in order.order_items:
            order_items.append({
                "name": item.menu_item.name,
                "quantity": item.quantity,
                "price": item.unit_price
            })
        
        formatted_orders.append({
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "status": order.status.value,
            "cafe_name": order.cafe.name,
            "customer_name": order.customer.full_name,
            "created_at": order.created_at.isoformat(),
            "items": order_items
        })
    
    return formatted_orders

# Feedback endpoint for cafe owners
@app.get("/feedback")
async def get_cafe_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all feedback for cafes owned by the current user."""
    if current_user.user_type != UserType.CAFE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only cafe owners can view feedback"
        )
    
    # Import OrderFeedback model
    from models import OrderFeedback
    
    # Get all feedback for cafes owned by this user
    feedback = db.query(OrderFeedback).join(Cafe).filter(
        Cafe.owner_id == current_user.id
    ).all()
    
    # Format the feedback with order and customer information
    formatted_feedback = []
    for fb in feedback:
        formatted_feedback.append({
            "id": fb.id,
            "order_id": fb.order_id,
            "order_number": fb.order.order_number,
            "cafe_name": fb.cafe.name,
            "customer_name": fb.customer.full_name,
            "rating": fb.rating,
            "feedback_text": fb.feedback_text,
            "created_at": fb.created_at.isoformat()
        })
    
    return formatted_feedback

# Menu items endpoints for cafe management
@app.get("/cafes/{cafe_id}/menu-items")
async def get_cafe_menu_items(
    cafe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get menu items for a specific cafe (for cafe owners)."""
    if current_user.user_type != UserType.CAFE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only cafe owners can view menu items"
        )
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(
        Cafe.id == cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found or access denied"
        )
    
    # Get menu items from Menu service
    try:
        import requests
        response = requests.get(f"http://localhost:8003/cafes/{cafe_id}/menu-items/public")
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        print(f"Error fetching menu items: {e}")
        return []

@app.get("/cafes/{cafe_id}/orders")
async def get_cafe_specific_orders(
    cafe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get orders for a specific cafe."""
    if current_user.user_type != UserType.CAFE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only cafe owners can view orders"
        )
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(
        Cafe.id == cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found or access denied"
        )
    
    # Get orders for this specific cafe
    orders = db.query(Order).filter(Order.cafe_id == cafe_id).all()
    
    # Format the orders
    formatted_orders = []
    for order in orders:
        order_items = []
        for item in order.order_items:
            order_items.append({
                "name": item.menu_item.name,
                "quantity": item.quantity,
                "price": item.unit_price
            })
        
        formatted_orders.append({
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "status": order.status.value,
            "customer_name": order.customer.full_name,
            "created_at": order.created_at.isoformat(),
            "items": order_items
        })
    
    return formatted_orders

# Categories endpoint for cafe management
@app.get("/categories")
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all categories for cafe owners."""
    if current_user.user_type != UserType.CAFE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only cafe owners can view categories"
        )
    
    # Get categories from Menu service
    try:
        import requests
        response = requests.get("http://localhost:8003/categories")
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return []

# Order management endpoints
@app.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_update: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update order status."""
    if current_user.user_type != UserType.CAFE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only cafe owners can update order status"
        )
    
    # Get order and verify cafe ownership
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(
        Cafe.id == order.cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found or access denied"
        )
    
    # Update order status
    order.status = status_update.get("status", order.status)
    if "estimated_preparation_time" in status_update:
        order.estimated_preparation_time = status_update["estimated_preparation_time"]
    
    db.commit()
    db.refresh(order)
    
    return {
        "id": order.id,
        "status": order.status.value,
        "estimated_preparation_time": order.estimated_preparation_time
    }

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 5002))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")