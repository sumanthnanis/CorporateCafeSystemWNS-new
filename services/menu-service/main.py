import os
import uvicorn
import requests
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db, engine
from models import Base, User, Cafe, MenuItem, Category, UserType
from middleware import get_current_user, get_current_cafe_owner

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Menu Management Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
from pydantic import BaseModel
from datetime import datetime

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    max_daily_quantity: int
    preparation_time: int = 15
    category_id: int
    cafe_id: int

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    max_daily_quantity: Optional[int] = None
    category_id: Optional[int] = None
    is_available: Optional[bool] = None

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
    category: CategoryResponse
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

@app.get("/")
async def root():
    return {"message": "Menu Management Service", "service": "menu", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "menu-management"}

# Category endpoints
@app.post("/categories", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Create a new food category."""
    # Check if category already exists
    existing_category = db.query(Category).filter(Category.name == category_data.name).first()
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    db_category = Category(
        name=category_data.name,
        description=category_data.description
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return CategoryResponse.model_validate(db_category)

@app.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """Get all food categories."""
    categories = db.query(Category).all()
    return [CategoryResponse.model_validate(category) for category in categories]

# Menu item endpoints
@app.post("/cafes/{cafe_id}/menu-items", response_model=MenuItemResponse)
async def create_menu_item(
    cafe_id: int,
    item_data: MenuItemCreate,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Add a new menu item to a cafe."""
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
    
    # Verify category exists
    category = db.query(Category).filter(Category.id == item_data.category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Create menu item
    db_item = MenuItem(
        name=item_data.name,
        description=item_data.description,
        price=item_data.price,
        max_daily_quantity=item_data.max_daily_quantity,
        available_quantity=item_data.max_daily_quantity,  # Start with max quantity
        preparation_time=item_data.preparation_time,
        cafe_id=cafe_id,
        category_id=item_data.category_id
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return MenuItemResponse.model_validate(db_item)

@app.get("/cafes/{cafe_id}/menu-items", response_model=List[MenuItemResponse])
async def get_menu_items(
    cafe_id: int,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Get all menu items for a cafe."""
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
    
    # Get ALL menu items for cafe owners (including unavailable ones)
    menu_items = db.query(MenuItem).filter(MenuItem.cafe_id == cafe_id).all()
    return [MenuItemResponse.model_validate(item) for item in menu_items]

@app.put("/menu-items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: int,
    item_data: MenuItemUpdate,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Update a menu item."""
    # Find menu item and verify ownership
    menu_item = db.query(MenuItem).join(Cafe).filter(
        MenuItem.id == item_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found or access denied"
        )
    
    # Update fields
    for field, value in item_data.dict(exclude_unset=True).items():
        setattr(menu_item, field, value)
    
    db.commit()
    db.refresh(menu_item)
    
    return MenuItemResponse.model_validate(menu_item)

@app.delete("/menu-items/{item_id}")
async def delete_menu_item(
    item_id: int,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Delete a menu item."""
    menu_item = db.query(MenuItem).join(Cafe).filter(
        MenuItem.id == item_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found or access denied"
        )
    
    # Check if menu item is referenced in any orders
    from models import OrderItem
    order_items = db.query(OrderItem).filter(OrderItem.menu_item_id == item_id).first()
    if order_items:
        # Instead of deleting, mark as unavailable
        menu_item.is_available = False
        menu_item.available_quantity = 0
        db.commit()
        return {"message": "Menu item marked as unavailable due to existing orders"}
    
    # If not referenced, safe to delete
    db.delete(menu_item)
    db.commit()
    
    return {"message": "Menu item deleted successfully"}

# Public endpoints for employees
@app.get("/menu-items/filter", response_model=List[MenuItemResponse])
async def filter_menu_items(
    cafe_id: Optional[int] = Query(None, description="Filter by specific cafe ID"),
    category_id: Optional[int] = Query(None, description="Filter by food category"),
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    available_only: bool = Query(True, description="Show only items currently in stock"),
    db: Session = Depends(get_db)
):
    """Advanced filtering for menu items with multiple criteria."""
    query = db.query(MenuItem).join(Cafe).filter(Cafe.is_active == True)
    
    if cafe_id:
        query = query.filter(MenuItem.cafe_id == cafe_id)
    
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    
    if min_price is not None:
        query = query.filter(MenuItem.price >= min_price)
    
    if max_price is not None:
        query = query.filter(MenuItem.price <= max_price)
    
    if available_only:
        query = query.filter(
            MenuItem.is_available == True,
            MenuItem.available_quantity > 0
        )
    
    menu_items = query.all()
    return [MenuItemResponse.model_validate(item) for item in menu_items]

@app.get("/cafes/{cafe_id}/menu-items/public", response_model=List[MenuItemResponse])
async def get_public_menu_items(
    cafe_id: int,
    db: Session = Depends(get_db)
):
    """Get all available menu items for a cafe (public endpoint)."""
    menu_items = db.query(MenuItem).join(Cafe).filter(
        MenuItem.cafe_id == cafe_id,
        Cafe.is_active == True,
        MenuItem.is_available == True,
        MenuItem.available_quantity > 0
    ).all()
    
    return [MenuItemResponse.model_validate(item) for item in menu_items]

@app.get("/menu-items/search", response_model=List[dict])
async def search_menu_items(
    query: str = Query(..., description="Search query for menu items"),
    db: Session = Depends(get_db)
):
    """Search menu items by name or description."""
    menu_items = db.query(MenuItem).join(Cafe).filter(
        Cafe.is_active == True,
        MenuItem.is_available == True,
        MenuItem.available_quantity > 0,
        (MenuItem.name.ilike(f"%{query}%") | MenuItem.description.ilike(f"%{query}%"))
    ).all()
    
    # Return menu items with cafe information
    results = []
    for item in menu_items:
        cafe = db.query(Cafe).filter(Cafe.id == item.cafe_id).first()
        category = db.query(Category).filter(Category.id == item.category_id).first()
        results.append({
            "id": item.id,
            "name": item.name,
            "description": item.description,
            "price": item.price,
            "available_quantity": item.available_quantity,
            "preparation_time": item.preparation_time,
            "cafe_id": item.cafe_id,
            "category_id": item.category_id,
            "cafe_name": cafe.name if cafe else "Unknown Cafe",
            "category_name": category.name if category else "Unknown Category"
        })
    
    return results

# Additional endpoints for cafe management
@app.post("/menu-items")
async def create_menu_item(
    menu_item: MenuItemCreate,
    db: Session = Depends(get_db)
):
    """Create a new menu item."""
    new_item = MenuItem(
        name=menu_item.name,
        description=menu_item.description,
        price=menu_item.price,
        max_daily_quantity=menu_item.max_daily_quantity,
        available_quantity=menu_item.max_daily_quantity,
        preparation_time=menu_item.preparation_time,
        cafe_id=menu_item.cafe_id,
        category_id=menu_item.category_id
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return new_item

@app.put("/menu-items/{menu_item_id}")
async def update_menu_item(
    menu_item_id: int,
    menu_item: MenuItemCreate,
    db: Session = Depends(get_db)
):
    """Update a menu item."""
    db_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    for key, value in menu_item.dict().items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    
    return db_item

@app.delete("/menu-items/{menu_item_id}")
async def delete_menu_item(
    menu_item_id: int,
    db: Session = Depends(get_db)
):
    """Delete a menu item."""
    db_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    db.delete(db_item)
    db.commit()
    
    return {"message": "Menu item deleted successfully"}

@app.patch("/menu-items/{menu_item_id}/availability")
async def toggle_availability(
    menu_item_id: int,
    availability_data: dict,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Toggle menu item availability."""
    # Find menu item and verify ownership
    menu_item = db.query(MenuItem).join(Cafe).filter(
        MenuItem.id == menu_item_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found or access denied"
        )
    
    # Update availability
    menu_item.is_available = availability_data.get('is_available', not menu_item.is_available)
    db.commit()
    db.refresh(menu_item)
    
    return MenuItemResponse.model_validate(menu_item)

@app.patch("/menu-items/{menu_item_id}/restock")
async def restock_item(
    menu_item_id: int,
    restock_data: dict,
    current_user: User = Depends(get_current_cafe_owner),
    db: Session = Depends(get_db)
):
    """Restock menu item and make it available."""
    # Find menu item and verify ownership
    menu_item = db.query(MenuItem).join(Cafe).filter(
        MenuItem.id == menu_item_id,
        Cafe.owner_id == current_user.id
    ).first()
    
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found or access denied"
        )
    
    # Update quantity - use provided quantity or reset to max
    new_quantity = restock_data.get('quantity', menu_item.max_daily_quantity)
    menu_item.available_quantity = new_quantity
    menu_item.is_available = True  # Automatically make item available when restocked
    db.commit()
    db.refresh(menu_item)
    
    return MenuItemResponse.model_validate(menu_item)

@app.post("/categories")
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new category."""
    new_category = Category(
        name=category.name,
        description=category.description
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return new_category

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 5003))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")