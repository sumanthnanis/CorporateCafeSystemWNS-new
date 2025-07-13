#!/bin/bash

echo "🛑 Stopping all microservices..."

# Kill services by PID if file exists
if [ -f .microservices_pids ]; then
    echo "Stopping services using saved PIDs..."
    PIDS=$(cat .microservices_pids)
    for pid in $PIDS; do
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping process $pid..."
            kill $pid
        fi
    done
    rm .microservices_pids
fi

# Also kill any remaining python processes running main.py
echo "Cleaning up any remaining service processes..."
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "uvicorn.*main:" 2>/dev/null || true

echo "✅ All microservices stopped!"
echo ""
echo "💡 To restart services, run: ./scripts/run-microservices.sh"