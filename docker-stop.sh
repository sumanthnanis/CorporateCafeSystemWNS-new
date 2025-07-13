#!/bin/bash

echo "=== Stopping Corporate Food Ordering System ==="

# Stop and remove containers
echo "🛑 Stopping all containers..."
docker-compose -f docker-compose.simple.yml down

# Remove unused images (optional)
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo "✅ All containers stopped successfully!"
echo ""
echo "💡 To start again, run: ./docker-build.sh"