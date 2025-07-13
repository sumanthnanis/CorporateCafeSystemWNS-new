#!/bin/bash

# Deployment script for microservices architecture
echo "🚀 Deploying Corporate Food Ordering Microservices..."

# Check if services are built
if [ ! "$(docker images -q food-ordering_user-service 2> /dev/null)" ]; then
    echo "⚠️ Services not built yet. Running build first..."
    ./scripts/build.sh
fi

# Start all services
echo "🔄 Starting all microservices..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

services=("user-service:5001" "cafe-service:5002" "menu-service:5003" "order-service:5004" "payment-service:5006" "notification-service:5007")

for service in "${services[@]}"; do
    service_name=$(echo $service | cut -d':' -f1)
    port=$(echo $service | cut -d':' -f2)
    
    if curl -f -s http://localhost:$port/health > /dev/null; then
        echo "✅ $service_name is healthy"
    else
        echo "❌ $service_name is not responding"
    fi
done

# Check gateway
if curl -f -s http://localhost/health > /dev/null; then
    echo "✅ API Gateway is healthy"
else
    echo "❌ API Gateway is not responding"
fi

# Check frontend
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not responding"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📍 Service URLs:"
echo "   🌐 Frontend:           http://localhost:3000"
echo "   🌐 API Gateway:        http://localhost"
echo "   👤 User Service:       http://localhost:5001"
echo "   🏪 Cafe Service:       http://localhost:5002"
echo "   📋 Menu Service:       http://localhost:5003"
echo "   📦 Order Service:      http://localhost:5004"
echo "   💳 Payment Service:    http://localhost:5006"
echo "   🔔 Notification:       http://localhost:5007"
echo "   🗄️ PostgreSQL:         localhost:5432"
echo ""
echo "📊 Monitor services with: docker-compose logs -f [service-name]"
echo "🛑 Stop services with: docker-compose down"
echo ""
echo "🔗 Access the application at: http://localhost:3000"