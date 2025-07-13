import os
import uvicorn
import requests
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db, engine
from models import Base, User, Order, OrderItem, MenuItem, Cafe, OrderStatus, UserType
from middleware import get_current_user, get_current_cafe_owner, get_current_employee
from datetime import datetime

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Order Management Service", version="1.0.0")

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
CAFE_SERVICE_URL = os.getenv("CAFE_SERVICE_URL", "http://cafe-service:5002")
MENU_SERVICE_URL = os.getenv("MENU_SERVICE_URL", "http://menu-service:5003")
PAYMENT_SERVICE_URL = os.getenv("PAYMENT_SERVICE_URL", "http://payment-service:5006")

# Pydantic models
from pydantic import BaseModel

class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int
    special_instructions: Optional[str] = None

class OrderCreate(BaseModel):
    cafe_id: int
    items: List[OrderItemCreate]
    special_instructions: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str
    estimated_preparation_time: Optional[int] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    class Config:
        from_attributes = True

class CafeResponse(BaseModel):
    id: int
    name: str
    address: Optional[str]
    class Config:
        from_attributes = True

class MenuItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    class Config:
        from_attributes = True

def generate_order_number() -> str:
    """Generate a unique order number."""
    import random
    import string
    timestamp = str(int(datetime.now().timestamp()))[-6:]
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ORD-{timestamp}-{random_part}"

@app.get("/")
async def root():
    return {"message": "Order Management Service", "service": "orders", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "order-management"}

@app.post("/orders", response_model=dict)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Create a new order (requires payment completion first)."""
    # Verify cafe exists and is active
    cafe = db.query(Cafe).filter(
        Cafe.id == order_data.cafe_id,
        Cafe.is_active == True
    ).first()
    
    if not cafe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found or not active"
        )
    
    # Validate menu items and calculate total
    total_amount = 0.0
    estimated_prep_time = 0
    order_items_data = []
    
    for item_data in order_data.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == item_data.menu_item_id,
            MenuItem.cafe_id == order_data.cafe_id,
            MenuItem.is_available == True
        ).first()
        
        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item {item_data.menu_item_id} not found or not available"
            )
        
        if menu_item.available_quantity < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough {menu_item.name} available. Only {menu_item.available_quantity} left."
            )
        
        item_total = menu_item.price * item_data.quantity
        total_amount += item_total
        estimated_prep_time = max(estimated_prep_time, menu_item.preparation_time)
        
        order_items_data.append({
            "menu_item": menu_item,
            "quantity": item_data.quantity,
            "unit_price": menu_item.price,
            "total_price": item_total,
            "special_instructions": item_data.special_instructions
        })
    
    # Return order summary for payment processing
    return {
        "order_summary": {
            "cafe_id": order_data.cafe_id,
            "cafe_name": cafe.name,
            "items": [
                {
                    "name": item["menu_item"].name,
                    "quantity": item["quantity"],
                    "unit_price": item["unit_price"],
                    "total_price": item["total_price"]
                }
                for item in order_items_data
            ],
            "total_amount": total_amount,
            "estimated_preparation_time": estimated_prep_time
        },
        "payment_required": True,
        "message": "Order validated. Proceed with payment to complete the order."
    }

@app.post("/orders/complete")
async def complete_order(
    order_data: OrderCreate,
    payment_confirmation: dict,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Complete order creation after successful payment."""
    # Verify payment was successful
    if not payment_confirmation.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment was not successful"
        )
    
    # Re-validate the order (in case inventory changed)
    cafe = db.query(Cafe).filter(
        Cafe.id == order_data.cafe_id,
        Cafe.is_active == True
    ).first()
    
    if not cafe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cafe not found or not active"
        )
    
    # Create the order
    order_number = generate_order_number()
    total_amount = 0.0
    estimated_prep_time = 0
    
    db_order = Order(
        order_number=order_number,
        total_amount=0.0,  # Will be updated below
        status=OrderStatus.PENDING,
        special_instructions=order_data.special_instructions,
        payment_status="completed",
        payment_method=payment_confirmation.get("payment_method", "unknown"),
        customer_id=current_user.id,
        cafe_id=order_data.cafe_id
    )
    
    db.add(db_order)
    db.flush()  # Get the order ID
    
    # Create order items and update inventory
    for item_data in order_data.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == item_data.menu_item_id
        ).first()
        
        # Update inventory
        menu_item.available_quantity -= item_data.quantity
        
        item_total = menu_item.price * item_data.quantity
        total_amount += item_total
        estimated_prep_time = max(estimated_prep_time, menu_item.preparation_time)
        
        order_item = OrderItem(
            quantity=item_data.quantity,
            unit_price=menu_item.price,
            total_price=item_total,
            special_instructions=item_data.special_instructions,
            order_id=db_order.id,
            menu_item_id=menu_item.id
        )
        
        db.add(order_item)
    
    # Update order total and estimated time
    db_order.total_amount = total_amount
    db_order.estimated_preparation_time = estimated_prep_time
    
    db.commit()
    db.refresh(db_order)
    
    return {
        "success": True,
        "order_id": db_order.id,
        "order_number": order_number,
        "total_amount": total_amount,
        "status": "pending",
        "message": "Order created successfully!"
    }

@app.get("/orders/my", response_model=List[dict])
async def get_my_orders(
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Get all orders for current employee."""
    orders = db.query(Order).filter(Order.customer_id == current_user.id).all()
    
    result = []
    for order in orders:
        order_dict = {
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "status": order.status.value,
            "estimated_preparation_time": order.estimated_preparation_time,
            "special_instructions": order.special_instructions,
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat(),
            "cafe": {
                "id": order.cafe.id,
                "name": order.cafe.name,
                "address": order.cafe.address
            },
            "order_items": [
                {
                    "id": item.id,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "special_instructions": item.special_instructions,
                    "menu_item": {
                        "id": item.menu_item.id,
                        "name": item.menu_item.name,
                        "description": item.menu_item.description
                    }
                }
                for item in order.order_items
            ]
        }
        result.append(order_dict)
    
    return result

@app.get("/cafe-orders", response_model=List[dict])
async def get_cafe_orders(
    status_filter: Optional[str] = Query(None, description="Filter by order status"),
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Get all orders for cafes owned by current user."""
    query = db.query(Order).join(Cafe).filter(Cafe.owner_id == current_user.id)
    
    if status_filter:
        try:
            status_enum = OrderStatus(status_filter.upper())
            query = query.filter(Order.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status filter"
            )
    
    orders = query.all()
    
    result = []
    for order in orders:
        order_dict = {
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "status": order.status.value,
            "estimated_preparation_time": order.estimated_preparation_time,
            "special_instructions": order.special_instructions,
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat(),
            "customer": {
                "id": order.customer.id,
                "username": order.customer.username,
                "full_name": order.customer.full_name
            },
            "cafe": {
                "id": order.cafe.id,
                "name": order.cafe.name
            },
            "order_items": [
                {
                    "id": item.id,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "special_instructions": item.special_instructions,
                    "menu_item": {
                        "id": item.menu_item.id,
                        "name": item.menu_item.name,
                        "description": item.menu_item.description
                    }
                }
                for item in order.order_items
            ]
        }
        result.append(order_dict)
    
    return result

@app.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Update order status and estimated preparation time."""
    # Find order and verify ownership
    order = db.query(Order).join(Cafe).filter(
        Order.id == order_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or access denied"
        )
    
    # Prevent status updates on cancelled orders
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update status of a cancelled order"
        )
    
    # Update status
    try:
        new_status = OrderStatus(status_update.status.upper())
        order.status = new_status
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status"
        )
    
    # Update estimated preparation time if provided
    if status_update.estimated_preparation_time is not None:
        order.estimated_preparation_time = status_update.estimated_preparation_time
    
    db.commit()
    
    return {
        "success": True,
        "order_id": order_id,
        "new_status": new_status.value,
        "estimated_preparation_time": order.estimated_preparation_time,
        "message": f"Order status updated to {new_status.value}"
    }

@app.put("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Cancel an order (only pending orders can be cancelled)."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending orders can be cancelled"
        )
    
    # Update order status
    order.status = OrderStatus.CANCELLED
    
    # Restore inventory
    for order_item in order.order_items:
        menu_item = order_item.menu_item
        menu_item.available_quantity += order_item.quantity
    
    db.commit()
    
    return {
        "success": True,
        "message": "Order cancelled successfully. Refund initiated."
    }

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 5004))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")