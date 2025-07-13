#!/bin/bash

echo "📜 Docker Compose Service Logs"
echo "==============================="

if [ -z "$1" ]; then
    echo "Available services:"
    echo "  - client (Frontend React App)"
    echo "  - user-service (Authentication & Users)"
    echo "  - cafe-service (Cafe Management)"
    echo "  - menu-service (Menu Items & Categories)"
    echo "  - feedback-service (Order Feedback)"
    echo "  - admin-service (Admin Management)"
    echo ""
    echo "Usage: $0 [service-name]"
    echo "Example: $0 user-service"
    echo ""
    echo "Or view all logs: docker-compose logs -f"
    exit 1
fi

echo "Showing logs for: $1"
echo "Press Ctrl+C to exit"
echo "==============================="
docker-compose logs -f "$1"