import os
import uvicorn
import random
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db, engine
from models import Base
from middleware import get_current_user
from datetime import datetime
from pydantic import BaseModel

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Payment Processing Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PaymentRequest(BaseModel):
    method: str  # 'credit_card', 'paypal', 'corporate_account', 'apple_pay'
    card_details: Optional[dict] = None  # For demo purposes
    amount: float

class PaymentResponse(BaseModel):
    success: bool
    transaction_id: Optional[str] = None
    message: str
    payment_method: str
    amount: float
    processed_at: datetime
    order_status: str
    error_code: Optional[str] = None

def generate_transaction_id() -> str:
    """Generate a mock transaction ID."""
    import string
    timestamp = str(int(datetime.now().timestamp()))[-8:]
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"TXN-{timestamp}-{random_part}"

def simulate_payment_processing(method: str, amount: float) -> dict:
    """Simulate payment processing with realistic success/failure rates."""
    # Different success rates for different payment methods
    success_rates = {
        "credit_card": 0.95,
        "paypal": 0.98,
        "corporate_account": 0.99,
        "apple_pay": 0.97,
        "google_pay": 0.97
    }
    
    success_rate = success_rates.get(method.lower(), 0.90)
    
    # Simulate processing delay
    import time
    time.sleep(random.uniform(0.5, 2.0))  # 0.5-2 second delay
    
    is_successful = random.random() < success_rate
    
    if is_successful:
        return {
            "success": True,
            "transaction_id": generate_transaction_id(),
            "message": f"Payment of ${amount:.2f} processed successfully via {method}",
            "error_code": None
        }
    else:
        # Simulate different types of failures
        failures = [
            {"error_code": "INSUFFICIENT_FUNDS", "message": "Insufficient funds in account"},
            {"error_code": "CARD_DECLINED", "message": "Payment method declined"},
            {"error_code": "NETWORK_ERROR", "message": "Network timeout - please try again"},
            {"error_code": "INVALID_CARD", "message": "Invalid payment method details"}
        ]
        
        failure = random.choice(failures)
        return {
            "success": False,
            "transaction_id": None,
            "message": failure["message"],
            "error_code": failure["error_code"]
        }

@app.get("/")
async def root():
    return {"message": "Payment Processing Service", "service": "payments", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "payment-processing"}

@app.post("/process-payment", response_model=PaymentResponse)
async def process_payment(
    payment_request: PaymentRequest,
    current_user = Depends(get_current_user)
):
    """Process a payment for an order."""
    
    # Validate payment method
    valid_methods = ["credit_card", "paypal", "corporate_account", "apple_pay", "google_pay"]
    if payment_request.method.lower() not in valid_methods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment method. Supported methods: {', '.join(valid_methods)}"
        )
    
    # Validate amount
    if payment_request.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than 0"
        )
    
    if payment_request.amount > 1000:  # Maximum order limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount exceeds maximum limit of $1000"
        )
    
    # Process the payment
    payment_result = simulate_payment_processing(
        payment_request.method, 
        payment_request.amount
    )
    
    # Prepare response
    response = PaymentResponse(
        success=payment_result["success"],
        transaction_id=payment_result["transaction_id"],
        message=payment_result["message"],
        payment_method=payment_request.method,
        amount=payment_request.amount,
        processed_at=datetime.now(),
        order_status="completed" if payment_result["success"] else "failed",
        error_code=payment_result["error_code"]
    )
    
    return response

@app.get("/payment-methods")
async def get_payment_methods():
    """Get available payment methods."""
    return {
        "methods": [
            {
                "id": "credit_card",
                "name": "Credit/Debit Card",
                "description": "Visa, MasterCard, American Express",
                "processing_fee": 0.029,  # 2.9%
                "success_rate": 0.95
            },
            {
                "id": "paypal",
                "name": "PayPal",
                "description": "Pay with your PayPal account",
                "processing_fee": 0.034,  # 3.4%
                "success_rate": 0.98
            },
            {
                "id": "corporate_account",
                "name": "Corporate Account",
                "description": "Company credit account",
                "processing_fee": 0.00,   # No fee for corporate
                "success_rate": 0.99
            },
            {
                "id": "apple_pay",
                "name": "Apple Pay",
                "description": "Pay with Touch ID or Face ID",
                "processing_fee": 0.029,  # 2.9%
                "success_rate": 0.97
            },
            {
                "id": "google_pay",
                "name": "Google Pay",
                "description": "Pay with your Google account",
                "processing_fee": 0.029,  # 2.9%
                "success_rate": 0.97
            }
        ]
    }

@app.post("/refund")
async def process_refund(
    transaction_id: str,
    amount: float,
    reason: str,
    current_user = Depends(get_current_user)
):
    """Process a refund for a transaction."""
    
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refund amount must be greater than 0"
        )
    
    # Simulate refund processing
    refund_success = random.random() < 0.98  # 98% success rate for refunds
    
    if refund_success:
        refund_id = generate_transaction_id().replace("TXN", "REF")
        return {
            "success": True,
            "refund_id": refund_id,
            "original_transaction_id": transaction_id,
            "amount": amount,
            "reason": reason,
            "processed_at": datetime.now(),
            "estimated_completion": "2-5 business days",
            "message": f"Refund of ${amount:.2f} initiated successfully"
        }
    else:
        return {
            "success": False,
            "error_code": "REFUND_FAILED",
            "message": "Unable to process refund at this time. Please contact support.",
            "processed_at": datetime.now()
        }

@app.get("/transaction/{transaction_id}")
async def get_transaction_status(
    transaction_id: str,
    current_user = Depends(get_current_user)
):
    """Get the status of a transaction."""
    
    # In a real system, this would query a database
    # For demo purposes, we'll return mock data
    return {
        "transaction_id": transaction_id,
        "status": "completed",
        "amount": 25.50,
        "payment_method": "credit_card",
        "processed_at": datetime.now(),
        "merchant": "Corporate Food Ordering System"
    }

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 5006))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")