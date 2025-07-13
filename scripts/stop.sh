#!/bin/bash

# Stop script for microservices
echo "🛑 Stopping Corporate Food Ordering Microservices..."

# Stop all containers
docker-compose down

# Remove volumes (optional - uncomment if you want to clear data)
# docker-compose down -v

echo "✅ All services stopped successfully!"
echo ""
echo "💡 To restart services, run: ./scripts/deploy.sh"
echo "🗑️ To completely reset (including data), run: docker-compose down -v"