#!/bin/bash

echo "=== Building Corporate Food Ordering System with Docker ==="
echo "This will build and run the application using Docker containers"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose.simple.yml down

# Build the containers
echo "🏗️  Building Docker containers..."
docker-compose -f docker-compose.simple.yml build

# Start the containers
echo "🚀 Starting the application..."
docker-compose -f docker-compose.simple.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

echo "✅ Application is running!"
echo ""
echo "🌐 Access the application at:"
echo "   Frontend: http://localhost:5000"
echo "   API: http://localhost:8001"
echo ""
echo "📋 To view logs:"
echo "   docker-compose -f docker-compose.simple.yml logs -f"
echo ""
echo "🛑 To stop the application:"
echo "   docker-compose -f docker-compose.simple.yml down"