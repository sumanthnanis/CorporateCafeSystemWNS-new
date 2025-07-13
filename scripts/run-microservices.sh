#!/bin/bash

# Alternative microservices runner (without Docker)
echo "🚀 Starting Corporate Food Ordering Microservices (Development Mode)..."

# Stop any existing services
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

# Set environment variables
export DATABASE_URL="sqlite:///./microservices.db"
export SECRET_KEY="your-secret-key-here-change-in-production"

# Create logs directory
mkdir -p logs

echo "📦 Installing requirements for all services..."

# Install requirements for each service
for service in user-service cafe-service menu-service order-service payment-service notification-service; do
    echo "Installing requirements for $service..."
    cd services/$service
    pip install -r requirements.txt --quiet
    cd ../..
done

echo "🔄 Starting microservices..."

# Start User Service (Port 5001)
echo "Starting User Management Service on port 5001..."
cd services/user-service
SERVICE_PORT=5001 python main.py > ../../logs/user-service.log 2>&1 &
USER_PID=$!
cd ../..

sleep 2

# Start Cafe Service (Port 5002)
echo "Starting Cafe Management Service on port 5002..."
cd services/cafe-service
SERVICE_PORT=5002 USER_SERVICE_URL=http://localhost:5001 python main.py > ../../logs/cafe-service.log 2>&1 &
CAFE_PID=$!
cd ../..

sleep 2

# Start Menu Service (Port 5003)
echo "Starting Menu Management Service on port 5003..."
cd services/menu-service
SERVICE_PORT=5003 USER_SERVICE_URL=http://localhost:5001 CAFE_SERVICE_URL=http://localhost:5002 python main.py > ../../logs/menu-service.log 2>&1 &
MENU_PID=$!
cd ../..

sleep 2

# Start Payment Service (Port 5006)
echo "Starting Payment Processing Service on port 5006..."
cd services/payment-service
SERVICE_PORT=5006 USER_SERVICE_URL=http://localhost:5001 python main.py > ../../logs/payment-service.log 2>&1 &
PAYMENT_PID=$!
cd ../..

sleep 2

# Start Order Service (Port 5004)
echo "Starting Order Management Service on port 5004..."
cd services/order-service
SERVICE_PORT=5004 USER_SERVICE_URL=http://localhost:5001 CAFE_SERVICE_URL=http://localhost:5002 MENU_SERVICE_URL=http://localhost:5003 PAYMENT_SERVICE_URL=http://localhost:5006 python main.py > ../../logs/order-service.log 2>&1 &
ORDER_PID=$!
cd ../..

sleep 2

# Start Notification Service (Port 5007)
echo "Starting Notification Service on port 5007..."
cd services/notification-service
SERVICE_PORT=5007 USER_SERVICE_URL=http://localhost:5001 python main.py > ../../logs/notification-service.log 2>&1 &
NOTIFICATION_PID=$!
cd ../..

# Save PIDs for later cleanup
echo "$USER_PID $CAFE_PID $MENU_PID $ORDER_PID $PAYMENT_PID $NOTIFICATION_PID" > .microservices_pids

echo "⏳ Waiting for services to start..."
sleep 10

echo "🏥 Checking service health..."

# Health check function
check_service() {
    local service_name=$1
    local port=$2
    
    if curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $service_name is healthy (port $port)"
        return 0
    else
        echo "❌ $service_name is not responding (port $port)"
        return 1
    fi
}

# Check all services
check_service "User Service" 5001
check_service "Cafe Service" 5002
check_service "Menu Service" 5003
check_service "Order Service" 5004
check_service "Payment Service" 5006
check_service "Notification Service" 5007

echo ""
echo "🎉 Microservices started successfully!"
echo ""
echo "📍 Service URLs:"
echo "   👤 User Service:       http://localhost:5001"
echo "   🏪 Cafe Service:       http://localhost:5002"
echo "   📋 Menu Service:       http://localhost:5003"
echo "   📦 Order Service:      http://localhost:5004"
echo "   💳 Payment Service:    http://localhost:5006"
echo "   🔔 Notification:       http://localhost:5007"
echo ""
echo "📊 View logs: tail -f logs/[service-name].log"
echo "🛑 Stop services: ./scripts/stop-microservices.sh"
echo ""
echo "🌐 The existing frontend will continue to work on port 5000"
echo "   You can modify the frontend to use the new microservices"