from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os

from database import SessionLocal, engine, Base
from models import User, Cafe, Order, OrderFeedback, OrderItem, MenuItem
from middleware import get_current_user, get_current_employee
from auth import verify_token

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Feedback Service", description="Order feedback and rating management service")

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

# Pydantic models
class FeedbackCreate(BaseModel):
    rating: int
    feedback_text: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    order_id: int
    customer_id: int
    cafe_id: int
    rating: int
    feedback_text: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class FeedbackWithDetails(BaseModel):
    id: int
    order_id: int
    rating: int
    feedback_text: Optional[str]
    created_at: datetime
    customer: dict
    order: dict
    
    class Config:
        from_attributes = True

@app.get("/")
async def root():
    return {"message": "Feedback Management Service", "service": "feedback", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "feedback-management"}

@app.post("/orders/{order_id}/feedback", response_model=FeedbackResponse)
async def create_feedback(
    order_id: int,
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Create feedback for an order (only employees can give feedback)."""
    # Validate rating
    if feedback_data.rating < 1 or feedback_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if order exists and belongs to the user
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order is completed/delivered
    if order.status.value not in ["DELIVERED", "READY"]:
        raise HTTPException(status_code=400, detail="Can only provide feedback for completed orders")
    
    # Check if feedback already exists
    existing_feedback = db.query(OrderFeedback).filter(
        OrderFeedback.order_id == order_id
    ).first()
    
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Feedback already provided for this order")
    
    # Create feedback
    feedback = OrderFeedback(
        order_id=order_id,
        customer_id=current_user.id,
        cafe_id=order.cafe_id,
        rating=feedback_data.rating,
        feedback_text=feedback_data.feedback_text
    )
    
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    
    return feedback

@app.get("/orders/{order_id}/feedback", response_model=Optional[FeedbackResponse])
async def get_order_feedback(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get feedback for a specific order."""
    # Check if order exists and user has access
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permissions
    if current_user.user_type.value == "EMPLOYEE" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only view feedback for your own orders")
    
    if current_user.user_type.value == "CAFE_OWNER":
        # Check if cafe belongs to the owner
        cafe = db.query(Cafe).filter(
            Cafe.id == order.cafe_id,
            Cafe.owner_id == current_user.id
        ).first()
        if not cafe:
            raise HTTPException(status_code=403, detail="Can only view feedback for your own cafes")
    
    # Get feedback
    feedback = db.query(OrderFeedback).filter(
        OrderFeedback.order_id == order_id
    ).first()
    
    return feedback

@app.get("/cafes/{cafe_id}/feedbacks", response_model=List[FeedbackWithDetails])
async def get_cafe_feedbacks(
    cafe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all feedbacks for a specific cafe."""
    # Check if cafe exists
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    
    # Check permissions (only cafe owner can view all feedbacks)
    if current_user.user_type.value == "CAFE_OWNER" and cafe.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only view feedbacks for your own cafes")
    
    # Get feedbacks with details
    feedbacks = db.query(OrderFeedback).filter(
        OrderFeedback.cafe_id == cafe_id
    ).all()
    
    result = []
    for feedback in feedbacks:
        feedback_dict = {
            "id": feedback.id,
            "order_id": feedback.order_id,
            "rating": feedback.rating,
            "feedback_text": feedback.feedback_text,
            "created_at": feedback.created_at,
            "customer": {
                "id": feedback.customer.id,
                "username": feedback.customer.username,
                "full_name": feedback.customer.full_name
            },
            "order": {
                "id": feedback.order.id,
                "order_number": feedback.order.order_number,
                "total_amount": feedback.order.total_amount,
                "created_at": feedback.order.created_at
            }
        }
        result.append(feedback_dict)
    
    return result

@app.get("/my-feedbacks", response_model=List[dict])
async def get_my_feedbacks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all feedbacks - for employees: their own, for cafe owners: all feedbacks for their cafes."""
    if current_user.user_type.value == "EMPLOYEE":
        feedbacks = db.query(OrderFeedback).filter(
            OrderFeedback.customer_id == current_user.id
        ).all()
    else:  # CAFE_OWNER
        # Get all feedbacks for cafes owned by this user
        feedbacks = db.query(OrderFeedback).join(Cafe).filter(
            Cafe.owner_id == current_user.id
        ).all()
    
    # Format detailed feedback response
    result = []
    for feedback in feedbacks:
        # Get order details
        order = db.query(Order).filter(Order.id == feedback.order_id).first()
        if not order:
            continue
        
        # Get customer details
        customer = db.query(User).filter(User.id == feedback.customer_id).first()
        if not customer:
            continue
        
        # Get cafe details
        cafe = db.query(Cafe).filter(Cafe.id == feedback.cafe_id).first()
        if not cafe:
            continue
        
        # Get order items
        order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
        
        # Format order items
        items = []
        for item in order_items:
            menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            if menu_item:
                items.append({
                    "name": menu_item.name,
                    "quantity": item.quantity,
                    "price": item.unit_price
                })
        
        feedback_dict = {
            "id": feedback.id,
            "order_id": feedback.order_id,
            "rating": feedback.rating,
            "feedback_text": feedback.feedback_text,
            "created_at": feedback.created_at,
            "customer": {
                "id": customer.id,
                "name": customer.full_name,
                "email": customer.email
            },
            "order": {
                "id": order.id,
                "order_number": order.order_number,
                "total_amount": order.total_amount,
                "status": order.status.value,
                "created_at": order.created_at,
                "items": items
            },
            "cafe": {
                "id": cafe.id,
                "name": cafe.name
            }
        }
        result.append(feedback_dict)
    
    return result

@app.get("/orders/{order_id}/can-feedback")
async def can_give_feedback(
    order_id: int,
    current_user: User = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Check if user can give feedback for an order."""
    # Check if order exists and belongs to the user
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.customer_id == current_user.id
    ).first()
    
    if not order:
        return {"can_feedback": False, "reason": "Order not found"}
    
    # Check if order is completed/delivered
    if order.status.value not in ["DELIVERED", "READY"]:
        return {"can_feedback": False, "reason": "Order not yet completed"}
    
    # Check if feedback already exists
    existing_feedback = db.query(OrderFeedback).filter(
        OrderFeedback.order_id == order_id
    ).first()
    
    if existing_feedback:
        return {"can_feedback": False, "reason": "Feedback already provided"}
    
    return {"can_feedback": True, "reason": "Ready for feedback"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", 8004))
    uvicorn.run(app, host="0.0.0.0", port=port)