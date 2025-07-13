#!/bin/bash

echo "=== Railway Deployment Setup ==="
echo "This script helps you deploy to Railway.app with Docker"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    echo "Please install Railway CLI first:"
    echo "npm install -g @railway/cli"
    echo "Or visit: https://railway.app/cli"
    exit 1
fi

echo "🚂 Setting up Railway deployment..."

# Login to Railway
echo "1. Please login to Railway:"
railway login

# Create a new project
echo "2. Creating new Railway project..."
railway init

# Add environment variables
echo "3. Setting up environment variables..."
railway variables set DATABASE_URL="sqlite:///shared_microservices.db"
railway variables set SECRET_KEY="your-production-secret-key-here"
railway variables set SERVICE_PORT="8001"

# Deploy the application
echo "4. Deploying application..."
railway up

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Visit Railway dashboard to see deployment status"
echo "2. Configure custom domain if needed"
echo "3. Check logs: railway logs"
echo ""
echo "🌐 Your app will be available at the Railway-provided URL"