import os
import uvicorn
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, List
from database import get_db, engine
from models import Base, User, UserType
from middleware import get_current_user
from datetime import datetime

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notification Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "CAFE_OWNER": [],
            "EMPLOYEE": []
        }

    async def connect(self, websocket: WebSocket, user_type: str):
        await websocket.accept()
        if user_type in self.active_connections:
            self.active_connections[user_type].append(websocket)
        print(f"User type {user_type} connected. Total connections: {len(self.active_connections[user_type])}")

    def disconnect(self, websocket: WebSocket, user_type: str):
        if user_type in self.active_connections and websocket in self.active_connections[user_type]:
            self.active_connections[user_type].remove(websocket)
        print(f"User type {user_type} disconnected. Total connections: {len(self.active_connections[user_type])}")

    async def send_to_user_type(self, message: str, user_type: str):
        """Send message to all users of a specific type."""
        if user_type not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[user_type]:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.active_connections[user_type].remove(connection)

    async def send_to_all(self, message: str):
        """Send message to all connected users."""
        for user_type in self.active_connections:
            await self.send_to_user_type(message, user_type)

    async def broadcast_order_update(self, order_data: dict, target_user_type: str = None):
        """Broadcast order updates to relevant users."""
        message = {
            "type": "order_update",
            "data": order_data,
            "timestamp": datetime.now().isoformat()
        }
        
        message_str = json.dumps(message)
        
        if target_user_type:
            await self.send_to_user_type(message_str, target_user_type)
        else:
            # Send to both cafe owners and employees
            await self.send_to_all(message_str)

    async def broadcast_menu_update(self, menu_data: dict):
        """Broadcast menu updates to employees."""
        message = {
            "type": "menu_update",
            "data": menu_data,
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_to_user_type(json.dumps(message), "EMPLOYEE")

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Notification Service", "service": "notifications", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "notification"}

@app.websocket("/ws/{user_type}")
async def websocket_endpoint(websocket: WebSocket, user_type: str):
    """WebSocket endpoint for real-time notifications."""
    
    # Validate user type
    valid_types = ["CAFE_OWNER", "EMPLOYEE"]
    if user_type not in valid_types:
        await websocket.close(code=1008)  # Policy violation
        return
    
    await manager.connect(websocket, user_type)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Handle ping/pong for connection health
            if data == "ping":
                await websocket.send_text("pong")
            else:
                # Echo message back (for testing)
                await websocket.send_text(f"Received: {data}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_type)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_type)

@app.post("/notify/order-status")
async def notify_order_status(
    order_id: int,
    status: str,
    customer_id: int,
    cafe_owner_id: int,
    order_details: dict = None
):
    """Send order status notification to relevant users."""
    
    # Prepare notification data
    notification_data = {
        "order_id": order_id,
        "status": status,
        "customer_id": customer_id,
        "cafe_owner_id": cafe_owner_id,
        "details": order_details or {},
        "message": f"Order #{order_id} status updated to {status}"
    }
    
    # Send to both cafe owners and employees
    await manager.broadcast_order_update(notification_data)
    
    return {
        "success": True,
        "message": "Order status notification sent",
        "recipients": ["CAFE_OWNER", "EMPLOYEE"]
    }

@app.post("/notify/new-order")
async def notify_new_order(
    order_data: dict
):
    """Notify cafe owners about new orders."""
    
    notification_data = {
        "type": "new_order",
        "order_id": order_data.get("order_id"),
        "order_number": order_data.get("order_number"),
        "customer_name": order_data.get("customer_name"),
        "total_amount": order_data.get("total_amount"),
        "cafe_id": order_data.get("cafe_id"),
        "message": f"New order #{order_data.get('order_number')} received"
    }
    
    # Send only to cafe owners
    await manager.broadcast_order_update(notification_data, "CAFE_OWNER")
    
    return {
        "success": True,
        "message": "New order notification sent to cafe owners"
    }

@app.post("/notify/menu-update")
async def notify_menu_update(
    menu_item_data: dict
):
    """Notify employees about menu changes."""
    
    notification_data = {
        "type": "menu_update",
        "item_id": menu_item_data.get("item_id"),
        "item_name": menu_item_data.get("item_name"),
        "cafe_id": menu_item_data.get("cafe_id"),
        "change_type": menu_item_data.get("change_type"),  # 'added', 'updated', 'removed', 'stock_changed'
        "available_quantity": menu_item_data.get("available_quantity"),
        "message": f"Menu item '{menu_item_data.get('item_name')}' has been updated"
    }
    
    # Send only to employees
    await manager.broadcast_menu_update(notification_data)
    
    return {
        "success": True,
        "message": "Menu update notification sent to employees"
    }

@app.post("/notify/payment-status")
async def notify_payment_status(
    payment_data: dict
):
    """Notify about payment status updates."""
    
    notification_data = {
        "type": "payment_update",
        "transaction_id": payment_data.get("transaction_id"),
        "status": payment_data.get("status"),
        "amount": payment_data.get("amount"),
        "customer_id": payment_data.get("customer_id"),
        "message": f"Payment {payment_data.get('status')} for ${payment_data.get('amount', 0):.2f}"
    }
    
    # Send to all users
    await manager.broadcast_order_update(notification_data)
    
    return {
        "success": True,
        "message": "Payment status notification sent"
    }

@app.get("/connections/status")
async def get_connection_status():
    """Get current WebSocket connection status."""
    return {
        "active_connections": {
            user_type: len(connections) 
            for user_type, connections in manager.active_connections.items()
        },
        "total_connections": sum(len(connections) for connections in manager.active_connections.values()),
        "service_status": "healthy"
    }

@app.post("/test-notification")
async def send_test_notification(
    user_type: str = "EMPLOYEE",
    message: str = "This is a test notification"
):
    """Send a test notification to specific user type."""
    
    if user_type not in ["CAFE_OWNER", "EMPLOYEE"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid user type"
        )
    
    test_data = {
        "type": "test",
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    await manager.send_to_user_type(json.dumps(test_data), user_type)
    
    return {
        "success": True,
        "message": f"Test notification sent to {user_type}",
        "recipients": len(manager.active_connections.get(user_type, []))
    }

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", 5007))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")