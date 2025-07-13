import os
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional, List
from auth import verify_password, get_password_hash, create_access_token, verify_token
from database import get_db, engine
from models import Base, User, UserType, Cafe, MenuItem, Order, OrderItem, Category, OrderStatus
from schemas import UserCreate, UserResponse, Token, UserLogin
from middleware import get_current_user

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="User Management Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "User Management Service", "service": "users", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user-management"}

@app.post("/register", response_model=Token)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (cafe owner or employee)."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        user_type=UserType(user_data.user_type.value)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": db_user.username})
    user_response = UserResponse.model_validate(db_user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.post("/login", response_model=Token)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    
    # Find user by username
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.username})
    user_response = UserResponse.model_validate(user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse.model_validate(current_user)

@app.get("/verify-token")
async def verify_user_token(current_user: User = Depends(get_current_user)):
    """Verify if token is valid and return user info."""
    return {
        "valid": True,
        "user_id": current_user.id,
        "username": current_user.username,
        "user_type": current_user.user_type.value,
        "email": current_user.email
    }

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID (for internal service communication)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.model_validate(user)

# Additional endpoints for testing - Cafe Owner features
@app.post("/cafe-owner/cafes")
async def create_cafe_endpoint(cafe_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new cafe (save to actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can create cafes")
    
    # Create new cafe in database
    new_cafe = Cafe(
        name=cafe_data.get("name", "New Cafe"),
        description=cafe_data.get("description", ""),
        address=cafe_data.get("address", ""),
        phone=cafe_data.get("phone", "555-0000"),
        owner_id=current_user.id,
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
        "created_at": new_cafe.created_at.isoformat() if new_cafe.created_at else "2025-07-11T09:00:00"
    }

@app.get("/cafe-owner/cafes")
async def get_my_cafes_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's cafes (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Query actual cafes from database
    cafes = db.query(Cafe).filter(Cafe.owner_id == current_user.id).all()
    
    # Convert to response format
    cafe_list = []
    for cafe in cafes:
        cafe_list.append({
            "id": cafe.id,
            "name": cafe.name,
            "description": cafe.description,
            "address": cafe.address,
            "phone": cafe.phone,
            "is_active": cafe.is_active,
            "owner_id": cafe.owner_id,
            "created_at": cafe.created_at.isoformat() if cafe.created_at else "2025-07-11T09:00:00"
        })
    
    return cafe_list

@app.get("/cafe-owner/cafes/{cafe_id}")
async def get_cafe_details(cafe_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get cafe details (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get the cafe and verify ownership
    cafe = db.query(Cafe).filter(
        Cafe.id == cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found or access denied")
    
    return {
        "id": cafe.id,
        "name": cafe.name,
        "description": cafe.description,
        "address": cafe.address,
        "phone": cafe.phone,
        "is_active": cafe.is_active,
        "owner_id": cafe.owner_id,
        "created_at": cafe.created_at.isoformat() if cafe.created_at else "2025-07-11T09:00:00"
    }

@app.get("/cafe-owner/orders")
async def get_cafe_orders_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get cafe orders (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get cafes owned by current user
    user_cafes = db.query(Cafe).filter(Cafe.owner_id == current_user.id).all()
    cafe_ids = [cafe.id for cafe in user_cafes]
    
    if not cafe_ids:
        return []
    
    # Get orders for user's cafes, ordered by newest first
    orders = db.query(Order).filter(Order.cafe_id.in_(cafe_ids)).order_by(Order.created_at.desc()).all()
    
    # Convert to response format
    order_list = []
    for order in orders:
        # Get customer info
        customer = db.query(User).filter(User.id == order.customer_id).first()
        
        # Get cafe info
        cafe = db.query(Cafe).filter(Cafe.id == order.cafe_id).first()
        
        # Get order items
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        items = []
        for item in order_items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            items.append({
                "name": menu_item.name if menu_item else "Unknown Item",
                "quantity": item.quantity,
                "price": item.unit_price
            })
        
        order_list.append({
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "status": order.status.value,
            "customer_name": customer.full_name if customer else "Unknown Customer",
            "cafe_name": cafe.name if cafe else "Unknown Cafe",
            "created_at": order.created_at.isoformat() if order.created_at else "",
            "items": items
        })
    
    return order_list

# Employee endpoints
@app.get("/employee/cafes")
async def get_cafes_for_employee(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get available cafes for employees (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    # Query all active cafes from database
    cafes = db.query(Cafe).filter(Cafe.is_active == True).all()
    
    # Convert to response format with menu count
    cafe_list = []
    for cafe in cafes:
        menu_count = db.query(MenuItem).filter(MenuItem.cafe_id == cafe.id).count()
        cafe_list.append({
            "id": cafe.id,
            "name": cafe.name,
            "description": cafe.description,
            "address": cafe.address,
            "phone": cafe.phone,
            "is_active": cafe.is_active,
            "menu_count": menu_count
        })
    
    return cafe_list

@app.get("/employee/orders")
async def get_employee_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get employee order history (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    # Get orders for current employee, ordered by newest first
    orders = db.query(Order).filter(Order.customer_id == current_user.id).order_by(Order.created_at.desc()).all()
    
    # Convert to response format
    order_list = []
    for order in orders:
        # Get cafe info
        cafe = db.query(Cafe).filter(Cafe.id == order.cafe_id).first()
        
        # Get order items
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        items = []
        for item in order_items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            items.append({
                "name": menu_item.name if menu_item else "Unknown Item",
                "quantity": item.quantity,
                "price": item.unit_price
            })
        
        order_list.append({
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "status": order.status.value,
            "cafe_name": cafe.name if cafe else "Unknown Cafe",
            "created_at": order.created_at.isoformat() if order.created_at else "",
            "items": items
        })
    
    return order_list

@app.get("/employee/orders/{order_id}")
async def get_employee_order_details(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get detailed information for a specific employee order (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    # Get order for current employee
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get cafe info
    cafe = db.query(Cafe).filter(Cafe.id == order.cafe_id).first()
    
    # Get order items with menu item details
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    items = []
    for item in order_items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
        items.append({
            "id": item.id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": item.total_price,
            "special_instructions": item.special_instructions,
            "menu_item": {
                "id": menu_item.id,
                "name": menu_item.name,
                "description": menu_item.description
            } if menu_item else {
                "id": 0,
                "name": "Unknown Item",
                "description": ""
            }
        })
    
    return {
        "id": order.id,
        "order_number": order.order_number,
        "total_amount": order.total_amount,
        "status": order.status.value,
        "estimated_preparation_time": order.estimated_preparation_time,
        "special_instructions": order.special_instructions,
        "payment_status": order.payment_status,
        "created_at": order.created_at.isoformat() if order.created_at else "",
        "updated_at": order.updated_at.isoformat() if order.updated_at else "",
        "cafe": {
            "id": cafe.id,
            "name": cafe.name,
            "description": cafe.description,
            "address": cafe.address,
            "phone": cafe.phone
        } if cafe else {
            "id": 0,
            "name": "Unknown Cafe",
            "description": "",
            "address": "",
            "phone": ""
        },
        "order_items": items
    }

@app.patch("/cafe-owner/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update order status (cafe owner only)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can update order status")
    
    # Get the order
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if this cafe owner owns the cafe for this order
    cafe = db.query(Cafe).filter(Cafe.id == order.cafe_id, Cafe.owner_id == current_user.id).first()
    if not cafe:
        raise HTTPException(status_code=403, detail="You can only update orders for your own cafes")
    
    # Validate status transition
    new_status = status_data.get("status")
    if new_status not in ["PENDING", "ACCEPTED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Update the order status
    from models import OrderStatus
    order.status = OrderStatus(new_status)
    
    # Set estimated preparation time if accepting order
    if new_status == "ACCEPTED" and "estimated_preparation_time" in status_data:
        order.estimated_preparation_time = status_data["estimated_preparation_time"]
    
    db.commit()
    
    return {
        "message": "Order status updated successfully",
        "order_id": order_id,
        "new_status": new_status
    }

@app.patch("/orders/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an order (employee only)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can cancel orders")
    
    # Get the order
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order can be cancelled
    if order.status.value != "PENDING":
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")
    
    # Update the order status to cancelled
    from models import OrderStatus
    order.status = OrderStatus.CANCELLED
    
    db.commit()
    
    return {
        "message": "Order cancelled successfully",
        "order_id": order_id,
        "status": "CANCELLED"
    }

# Additional endpoints for menu data
@app.get("/employee/cafes/{cafe_id}/menu")
async def get_cafe_menu(
    cafe_id: int, 
    category_id: Optional[int] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get menu items for a specific cafe (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    # Get menu items for the cafe
    query = db.query(MenuItem).filter(
        MenuItem.cafe_id == cafe_id,
        MenuItem.is_available == True,
        MenuItem.available_quantity > 0
    )
    
    # Add category filter if specified
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    
    menu_items = query.all()
    
    # Convert to response format
    items_list = []
    for item in menu_items:
        category = db.query(Category).filter(Category.id == item.category_id).first()
        items_list.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "category": category.name if category else "Uncategorized",
            "available": item.is_available and item.available_quantity > 0,
            "available_quantity": item.available_quantity,
            "is_available": item.is_available,
            "preparation_time": item.preparation_time
        })
    
    return items_list

@app.get("/employee/search")
async def search_food_items(
    query: str = Query(..., description="Search query"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Search food items across all cafes (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    # Build search query
    search_query = db.query(MenuItem).join(Cafe).filter(
        Cafe.is_active == True,
        MenuItem.is_available == True,
        MenuItem.available_quantity > 0
    )
    
    # Add text search on name and description
    search_terms = query.lower().split()
    for term in search_terms:
        search_query = search_query.filter(
            (MenuItem.name.ilike(f"%{term}%")) | 
            (MenuItem.description.ilike(f"%{term}%"))
        )
    
    # Add category filter if specified
    if category_id:
        search_query = search_query.filter(MenuItem.category_id == category_id)
    
    menu_items = search_query.all()
    
    # Convert to response format
    results = []
    for item in menu_items:
        cafe = db.query(Cafe).filter(Cafe.id == item.cafe_id).first()
        category = db.query(Category).filter(Category.id == item.category_id).first()
        
        results.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "category": category.name if category else "Uncategorized",
            "available": item.is_available and item.available_quantity > 0,
            "available_quantity": item.available_quantity,
            "is_available": item.is_available,
            "preparation_time": item.preparation_time,
            "cafe": {
                "id": cafe.id,
                "name": cafe.name,
                "description": cafe.description,
                "address": cafe.address
            } if cafe else None
        })
    
    return results

@app.get("/employee/categories")
async def get_categories_for_employee(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all food categories for employees (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    categories = db.query(Category).all()
    
    category_list = []
    for category in categories:
        # Count available menu items in this category
        item_count = db.query(MenuItem).filter(
            MenuItem.category_id == category.id,
            MenuItem.is_available == True,
            MenuItem.available_quantity > 0
        ).count()
        
        category_list.append({
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "item_count": item_count,
            "created_at": category.created_at.isoformat() if category.created_at else ""
        })
    
    return category_list

# Order management endpoints
@app.post("/orders")
@app.post("/orders/")
async def create_order(
    order_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new order (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can create orders")
    
    try:
        # Validate cafe exists and is active
        cafe = db.query(Cafe).filter(
            Cafe.id == order_data["cafe_id"],
            Cafe.is_active == True
        ).first()
        
        if not cafe:
            raise HTTPException(status_code=404, detail="Cafe not found or not active")
        
        # Calculate total amount and validate items
        total_amount = 0
        validated_items = []
        
        for item_data in order_data["items"]:
            menu_item = db.query(MenuItem).filter(
                MenuItem.id == item_data["menu_item_id"],
                MenuItem.cafe_id == order_data["cafe_id"],
                MenuItem.is_available == True
            ).first()
            
            if not menu_item:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Menu item {item_data['menu_item_id']} not found or not available"
                )
            
            if menu_item.available_quantity < item_data["quantity"]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Not enough stock for {menu_item.name}. Available: {menu_item.available_quantity}"
                )
            
            item_total = menu_item.price * item_data["quantity"]
            total_amount += item_total
            
            validated_items.append({
                "menu_item": menu_item,
                "quantity": item_data["quantity"],
                "unit_price": menu_item.price,
                "total_price": item_total,
                "special_instructions": item_data.get("special_instructions", "")
            })
        
        # Generate unique order number
        import uuid
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # Calculate estimated preparation time (max of all items)
        estimated_time = max([item["menu_item"].preparation_time for item in validated_items], default=15)
        
        # Create order
        new_order = Order(
            order_number=order_number,
            total_amount=total_amount,
            status=OrderStatus.PENDING,
            estimated_preparation_time=estimated_time,
            special_instructions=order_data.get("special_instructions", ""),
            payment_status="pending",
            customer_id=current_user.id,
            cafe_id=order_data["cafe_id"]
        )
        
        db.add(new_order)
        db.flush()  # Get the order ID
        
        # Create order items
        for item_data in validated_items:
            order_item = OrderItem(
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                total_price=item_data["total_price"],
                special_instructions=item_data["special_instructions"],
                order_id=new_order.id,
                menu_item_id=item_data["menu_item"].id
            )
            db.add(order_item)
            
            # Reduce available quantity
            item_data["menu_item"].available_quantity -= item_data["quantity"]
        
        db.commit()
        
        # Return order details
        return {
            "id": new_order.id,
            "order_number": new_order.order_number,
            "total_amount": new_order.total_amount,
            "status": new_order.status.value,
            "estimated_preparation_time": new_order.estimated_preparation_time,
            "special_instructions": new_order.special_instructions,
            "payment_status": new_order.payment_status,
            "customer_id": new_order.customer_id,
            "cafe_id": new_order.cafe_id,
            "created_at": new_order.created_at.isoformat() if new_order.created_at else ""
        }
        
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

# Payment endpoints (mock payment system)
@app.get("/payments/payment-methods")
async def get_payment_methods(current_user: User = Depends(get_current_user)):
    """Get available payment methods (mock for demo)."""
    return {
        "methods": [
            {
                "id": "credit_card",
                "name": "Credit/Debit Card",
                "description": "Visa, Mastercard, American Express",
                "icon": "credit-card",
                "demo_cards": [
                    {"number": "**** **** **** 1234", "type": "Visa", "expires": "12/25"},
                    {"number": "**** **** **** 5678", "type": "Mastercard", "expires": "08/26"},
                    {"number": "**** **** **** 9012", "type": "Amex", "expires": "03/27"}
                ]
            },
            {
                "id": "paypal",
                "name": "PayPal",
                "description": "Pay with your PayPal account",
                "icon": "paypal"
            },
            {
                "id": "corporate_account",
                "name": "Corporate Account",
                "description": "Company credit line",
                "icon": "building"
            },
            {
                "id": "apple_pay",
                "name": "Apple Pay",
                "description": "Touch ID or Face ID",
                "icon": "smartphone"
            }
        ]
    }

@app.post("/payments/orders/{order_id}/process-payment")
async def process_payment(
    order_id: int,
    payment_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process payment for an order (mock payment system)."""
    # Get the order
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.payment_status == "completed":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Mock payment processing (90% success rate for demo)
    import random
    success = random.random() < 0.9
    
    if success:
        # Update order payment status
        order.payment_status = "completed"
        order.payment_method = payment_data.get("method", "unknown")
        db.commit()
        
        import uuid
        transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "amount": order.total_amount,
            "message": "Payment processed successfully"
        }
    else:
        # Simulate payment failure
        return {
            "success": False,
            "message": "Payment failed. Please try again or use a different payment method."
        }

# Inventory Management endpoints for cafe owners
@app.patch("/cafe-owner/menu-items/{item_id}/availability")
async def toggle_item_availability(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle menu item availability (mark as out of stock)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get menu item and verify ownership
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(
        Cafe.id == menu_item.cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(status_code=403, detail="You don't own this cafe")
    
    # Toggle availability
    menu_item.is_available = not menu_item.is_available
    if not menu_item.is_available:
        menu_item.available_quantity = 0
    
    db.commit()
    
    status = "available" if menu_item.is_available else "out of stock"
    return {
        "success": True,
        "message": f"Menu item marked as {status}",
        "item_id": item_id,
        "is_available": menu_item.is_available,
        "available_quantity": menu_item.available_quantity
    }

@app.patch("/cafe-owner/menu-items/{item_id}/restock")
async def restock_item(
    item_id: int,
    restock_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restock menu item with specified quantity."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get menu item and verify ownership
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(
        Cafe.id == menu_item.cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(status_code=403, detail="You don't own this cafe")
    
    # Get restock quantity
    quantity = restock_data.get("quantity", menu_item.max_daily_quantity)
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Restock quantity must be positive")
    
    # Update item quantity and availability
    menu_item.available_quantity = min(quantity, menu_item.max_daily_quantity)
    menu_item.is_available = True
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Menu item restocked with {menu_item.available_quantity} units",
        "item_id": item_id,
        "is_available": menu_item.is_available,
        "available_quantity": menu_item.available_quantity,
        "max_daily_quantity": menu_item.max_daily_quantity
    }

# Categories endpoint that the frontend is looking for
@app.get("/employee/cafes/{cafe_id}/categories")
async def get_cafe_categories(cafe_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get categories for a specific cafe (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    # Get unique categories used by menu items in this cafe
    categories = db.query(Category).join(MenuItem).filter(
        MenuItem.cafe_id == cafe_id,
        MenuItem.is_available == True
    ).distinct().all()
    
    # Convert to response format
    category_list = []
    for category in categories:
        category_list.append({
            "id": category.id,
            "name": category.name,
            "description": category.description
        })
    
    return category_list

# Dummy data initialization endpoint that frontend is calling
@app.post("/employee/init-dummy-data")
async def init_dummy_data(current_user: User = Depends(get_current_user)):
    """Initialize dummy data (placeholder endpoint)."""
    return {"message": "Dummy data already initialized", "status": "success"}

# Missing cafe owner endpoints that frontend expects

@app.get("/cafe-owner/categories") 
async def get_categories_cafe_owner(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all food categories for cafe owners (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get all categories from database
    categories = db.query(Category).all()
    
    # Convert to response format
    category_list = []
    for category in categories:
        category_list.append({
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "created_at": category.created_at.isoformat() if category.created_at else ""
        })
    
    return category_list

@app.post("/cafe-owner/categories")
async def create_category_cafe_owner(category_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new category (save to actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Create new category in database
    new_category = Category(
        name=category_data.get("name", "New Category"),
        description=category_data.get("description", "")
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return {
        "id": new_category.id,
        "name": new_category.name,
        "description": new_category.description,
        "created_at": new_category.created_at.isoformat() if new_category.created_at else ""
    }

@app.put("/cafe-owner/categories/{category_id}")
async def update_category_cafe_owner(
    category_id: int,
    category_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a category (save to actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get the category
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Update category fields
    category.name = category_data.get("name", category.name)
    category.description = category_data.get("description", category.description)
    
    db.commit()
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "created_at": category.created_at.isoformat() if category.created_at else ""
    }

@app.delete("/cafe-owner/categories/{category_id}")
async def delete_category_cafe_owner(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a category (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get the category
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is being used by any menu items
    menu_items_count = db.query(MenuItem).filter(MenuItem.category_id == category_id).count()
    if menu_items_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category. It is being used by {menu_items_count} menu items."
        )
    
    # Delete the category
    db.delete(category)
    db.commit()
    
    return {
        "message": "Category deleted successfully",
        "id": category_id
    }

@app.get("/cafe-owner/cafes/{cafe_id}/menu-items")
async def get_menu_items_cafe_owner(cafe_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get menu items for a cafe (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id, Cafe.owner_id == current_user.id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found or access denied")
    
    # Get menu items for the cafe
    menu_items = db.query(MenuItem).filter(MenuItem.cafe_id == cafe_id).all()
    
    # Convert to response format
    items_list = []
    for item in menu_items:
        category = db.query(Category).filter(Category.id == item.category_id).first()
        items_list.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "category": {
                "id": category.id,
                "name": category.name
            } if category else {"id": 0, "name": "Uncategorized"},
            "is_available": item.is_available,
            "available_quantity": item.available_quantity,
            "max_daily_quantity": item.max_daily_quantity,
            "preparation_time": item.preparation_time,
            "created_at": item.created_at.isoformat() if item.created_at else "",
            "updated_at": item.updated_at.isoformat() if item.updated_at else ""
        })
    
    return items_list

# Menu item update and delete endpoints (the missing ones causing 404 errors)
@app.put("/cafe-owner/menu-items/{item_id}")
async def update_menu_item_cafe_owner(
    item_id: int,
    item_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a menu item."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get menu item and verify ownership
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(
        Cafe.id == menu_item.cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(status_code=403, detail="You don't own this cafe")
    
    # Update allowed fields
    if "name" in item_data:
        menu_item.name = item_data["name"]
    if "description" in item_data:
        menu_item.description = item_data["description"]
    if "price" in item_data:
        menu_item.price = float(item_data["price"])
    if "max_daily_quantity" in item_data:
        menu_item.max_daily_quantity = int(item_data["max_daily_quantity"])
    if "preparation_time" in item_data:
        menu_item.preparation_time = int(item_data["preparation_time"])
    if "category_id" in item_data:
        menu_item.category_id = int(item_data["category_id"])
    if "is_available" in item_data:
        menu_item.is_available = bool(item_data["is_available"])
    
    # Update timestamp
    from datetime import datetime
    menu_item.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(menu_item)
    
    # Get category info
    category = db.query(Category).filter(Category.id == menu_item.category_id).first()
    
    return {
        "id": menu_item.id,
        "name": menu_item.name,
        "description": menu_item.description,
        "price": menu_item.price,
        "available_quantity": menu_item.available_quantity,
        "max_daily_quantity": menu_item.max_daily_quantity,
        "is_available": menu_item.is_available,
        "preparation_time": menu_item.preparation_time,
        "cafe_id": menu_item.cafe_id,
        "category": {
            "id": category.id,
            "name": category.name,
            "description": category.description
        } if category else None,
        "created_at": menu_item.created_at.isoformat() if menu_item.created_at else "",
        "updated_at": menu_item.updated_at.isoformat() if menu_item.updated_at else ""
    }

@app.delete("/cafe-owner/menu-items/{item_id}")
async def delete_menu_item_cafe_owner(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a menu item."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Get menu item and verify ownership
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(
        Cafe.id == menu_item.cafe_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not cafe:
        raise HTTPException(status_code=403, detail="You don't own this cafe")
    
    # Check if item is part of any pending orders
    pending_orders = db.query(OrderItem).join(Order).filter(
        OrderItem.menu_item_id == item_id,
        Order.status.in_(['PENDING', 'ACCEPTED', 'PREPARING'])
    ).first()
    
    if pending_orders:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete menu item that is part of pending orders"
        )
    
    # Delete the menu item
    db.delete(menu_item)
    db.commit()
    
    return {
        "success": True,
        "message": "Menu item deleted successfully",
        "item_id": item_id
    }

@app.post("/cafe-owner/cafes/{cafe_id}/menu-items")
async def create_menu_item_cafe_owner(cafe_id: int, item_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new menu item (save to actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id, Cafe.owner_id == current_user.id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found or access denied")
    
    # Create new menu item in database
    new_menu_item = MenuItem(
        name=item_data.get("name", "New Item"),
        description=item_data.get("description", ""),
        price=float(item_data.get("price", 0.0)),
        max_daily_quantity=int(item_data.get("max_daily_quantity", 100)),
        available_quantity=int(item_data.get("max_daily_quantity", 100)),
        preparation_time=int(item_data.get("preparation_time", 15)),
        cafe_id=cafe_id,
        category_id=int(item_data.get("category_id", 1)),
        is_available=True
    )
    
    db.add(new_menu_item)
    db.commit()
    db.refresh(new_menu_item)
    
    # Get category info
    category = db.query(Category).filter(Category.id == new_menu_item.category_id).first()
    
    return {
        "id": new_menu_item.id,
        "name": new_menu_item.name,
        "description": new_menu_item.description,
        "price": new_menu_item.price,
        "category": {
            "id": category.id,
            "name": category.name
        } if category else {"id": 0, "name": "Uncategorized"},
        "is_available": new_menu_item.is_available,
        "available_quantity": new_menu_item.available_quantity,
        "max_daily_quantity": new_menu_item.max_daily_quantity,
        "preparation_time": new_menu_item.preparation_time,
        "created_at": new_menu_item.created_at.isoformat() if new_menu_item.created_at else ""
    }

# Additional CRUD endpoints for complete functionality

@app.put("/cafe-owner/cafes/{cafe_id}/menu-items/{item_id}")
async def update_menu_item_cafe_owner(cafe_id: int, item_id: int, item_data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update a menu item (save to actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Verify cafe ownership and get menu item
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id, Cafe.owner_id == current_user.id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found or access denied")
    
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.cafe_id == cafe_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Update menu item fields
    if "name" in item_data:
        menu_item.name = item_data["name"]
    if "description" in item_data:
        menu_item.description = item_data["description"]
    if "price" in item_data:
        menu_item.price = float(item_data["price"])
    if "max_daily_quantity" in item_data:
        menu_item.max_daily_quantity = int(item_data["max_daily_quantity"])
        menu_item.available_quantity = int(item_data["max_daily_quantity"])  # Reset available quantity
    if "preparation_time" in item_data:
        menu_item.preparation_time = int(item_data["preparation_time"])
    if "category_id" in item_data:
        menu_item.category_id = int(item_data["category_id"])
    if "is_available" in item_data:
        menu_item.is_available = bool(item_data["is_available"])
    
    db.commit()
    db.refresh(menu_item)
    
    # Get category info
    category = db.query(Category).filter(Category.id == menu_item.category_id).first()
    
    return {
        "id": menu_item.id,
        "name": menu_item.name,
        "description": menu_item.description,
        "price": menu_item.price,
        "category": {
            "id": category.id,
            "name": category.name
        } if category else {"id": 0, "name": "Uncategorized"},
        "is_available": menu_item.is_available,
        "available_quantity": menu_item.available_quantity,
        "max_daily_quantity": menu_item.max_daily_quantity,
        "preparation_time": menu_item.preparation_time,
        "updated_at": menu_item.updated_at.isoformat() if menu_item.updated_at else ""
    }

@app.delete("/cafe-owner/cafes/{cafe_id}/menu-items/{item_id}")
async def delete_menu_item_cafe_owner(cafe_id: int, item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a menu item (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Verify cafe ownership and get menu item
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id, Cafe.owner_id == current_user.id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found or access denied")
    
    menu_item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.cafe_id == cafe_id).first()
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    db.delete(menu_item)
    db.commit()
    
    return {"message": "Menu item deleted successfully"}

@app.get("/cafe-owner/cafes/{cafe_id}")
async def get_cafe_details(cafe_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get cafe details (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id, Cafe.owner_id == current_user.id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found or access denied")
    
    return {
        "id": cafe.id,
        "name": cafe.name,
        "description": cafe.description,
        "address": cafe.address,
        "phone": cafe.phone,
        "is_active": cafe.is_active,
        "owner_id": cafe.owner_id,
        "created_at": cafe.created_at.isoformat() if cafe.created_at else ""
    }

@app.get("/cafe-owner/cafes/{cafe_id}/orders")
async def get_cafe_specific_orders(cafe_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get orders for a specific cafe (from actual database)."""
    if current_user.user_type.value != "CAFE_OWNER":
        raise HTTPException(status_code=403, detail="Only cafe owners can access this")
    
    # Verify cafe ownership
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id, Cafe.owner_id == current_user.id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found or access denied")
    
    # Get orders for this specific cafe
    orders = db.query(Order).filter(Order.cafe_id == cafe_id).all()
    
    # Convert to response format
    order_list = []
    for order in orders:
        # Get customer info
        customer = db.query(User).filter(User.id == order.customer_id).first()
        
        # Get order items
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        items = []
        for item in order_items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            items.append({
                "name": menu_item.name if menu_item else "Unknown Item",
                "quantity": item.quantity,
                "price": item.unit_price
            })
        
        order_list.append({
            "id": order.id,
            "order_number": order.order_number,
            "total_amount": order.total_amount,
            "status": order.status.value,
            "customer_name": customer.full_name if customer else "Unknown Customer",
            "created_at": order.created_at.isoformat() if order.created_at else "",
            "items": items
        })
    
    return order_list

# Additional missing employee endpoints

@app.get("/employee/categories")
async def get_all_categories_employee(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all food categories for employees (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    # Get all categories from database
    categories = db.query(Category).all()
    
    # Convert to response format
    category_list = []
    for category in categories:
        category_list.append({
            "id": category.id,
            "name": category.name,
            "description": category.description
        })
    
    return category_list

@app.get("/employee/menu-items/filter")
async def filter_menu_items_employee(
    cafe_id: Optional[int] = Query(None, description="Filter by cafe ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    available_only: bool = Query(True, description="Show only available items"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Filter menu items with various criteria (from actual database)."""
    if current_user.user_type.value != "EMPLOYEE":
        raise HTTPException(status_code=403, detail="Only employees can access this")
    
    # Start with base query
    query = db.query(MenuItem)
    
    # Apply filters
    if cafe_id:
        query = query.filter(MenuItem.cafe_id == cafe_id)
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    if min_price is not None:
        query = query.filter(MenuItem.price >= min_price)
    if max_price is not None:
        query = query.filter(MenuItem.price <= max_price)
    if available_only:
        query = query.filter(MenuItem.is_available == True, MenuItem.available_quantity > 0)
    
    # Get results
    menu_items = query.all()
    
    # Convert to response format
    items_list = []
    for item in menu_items:
        # Get cafe info
        cafe = db.query(Cafe).filter(Cafe.id == item.cafe_id).first()
        # Get category info
        category = db.query(Category).filter(Category.id == item.category_id).first()
        
        items_list.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "category": category.name if category else "Uncategorized",
            "available": item.is_available and item.available_quantity > 0,
            "available_quantity": item.available_quantity,
            "cafe": {
                "id": cafe.id,
                "name": cafe.name
            } if cafe else {"id": 0, "name": "Unknown Cafe"}
        })
    
    return items_list

# WebSocket endpoint for notifications
@app.websocket("/ws/{user_type}")
async def websocket_endpoint(websocket: WebSocket, user_type: str):
    """WebSocket endpoint for real-time notifications."""
    await websocket.accept()
    try:
        while True:
            # Keep connection alive and send periodic updates
            await websocket.send_json({
                "type": "ping",
                "message": "Connection active",
                "timestamp": "2025-07-11T09:00:00"
            })
            import asyncio
            await asyncio.sleep(30)
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 5001))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")