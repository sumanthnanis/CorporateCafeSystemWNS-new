#!/bin/bash

# Logs script for monitoring microservices
echo "📊 Microservices Logs Monitor"
echo ""

if [ "$1" = "" ]; then
    echo "📋 Available services:"
    echo "   - user-service"
    echo "   - cafe-service"
    echo "   - menu-service"
    echo "   - order-service"
    echo "   - payment-service"
    echo "   - notification-service"
    echo "   - client"
    echo "   - api-gateway"
    echo "   - postgres"
    echo ""
    echo "Usage: ./scripts/logs.sh [service-name]"
    echo "   or: ./scripts/logs.sh all (for all services)"
    echo ""
    exit 1
fi

if [ "$1" = "all" ]; then
    echo "📊 Showing logs for all services..."
    docker-compose logs -f
else
    echo "📊 Showing logs for $1..."
    docker-compose logs -f $1
fi