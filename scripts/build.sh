#!/bin/bash

# Build script for microservices architecture
echo "🚀 Building Corporate Food Ordering Microservices..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories if they don't exist
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data/postgres

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Remove old images (optional - uncomment if needed)
# echo "🗑️ Removing old images..."
# docker-compose down --rmi all

# Build all services
echo "🔨 Building all microservices..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ All microservices built successfully!"
    echo ""
    echo "🎉 Ready to deploy! Run './scripts/deploy.sh' to start all services."
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi