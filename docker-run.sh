#!/bin/bash

echo "🚀 Starting Corporate Food Ordering System with Docker Compose..."

# Make sure the shared database exists
if [ ! -f "./shared_microservices.db" ]; then
    echo "📝 Creating shared database..."
    touch ./shared_microservices.db
fi

# Build and start all services
echo "🔨 Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ Checking service health..."
echo "👤 User Service: http://localhost:8001/health"
echo "🏪 Cafe Service: http://localhost:8002/health"
echo "📋 Menu Service: http://localhost:8003/health"
echo "💬 Feedback Service: http://localhost:8004/health"
echo "⚙️  Admin Service: http://localhost:8005/health"
echo "🌐 Frontend Client: http://localhost:5000"

echo ""
echo "🎉 All services are starting up!"
echo "📱 Access the application at: http://localhost:5000"
echo "📊 View running containers: docker-compose ps"
echo "📜 View logs: docker-compose logs -f [service-name]"
echo "🛑 Stop all services: docker-compose down"