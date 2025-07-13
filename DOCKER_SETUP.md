# Updated Docker Setup Guide for Corporate Food Ordering System

This guide explains how to run the Corporate Food Ordering System using Docker and Docker Compose with the latest microservices architecture.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM available for Docker
- At least 2GB free disk space

## Current Architecture Overview

The system consists of 6 active microservices + frontend:

1. **Client** (Port 5000) - React frontend application
2. **User Service** (Port 8001) - Authentication, user management, orders, and payments
3. **Cafe Service** (Port 8002) - Cafe management and operations
4. **Menu Service** (Port 8003) - Menu items and categories
5. **Feedback Service** (Port 8004) - Order feedback and ratings
6. **Admin Service** (Port 8005) - Super admin management
7. **Future Services** (Ports 8006-8008) - Order, Payment, and Notification services (for future implementation)

## Quick Start

### Easy Setup (Recommended)

```bash
# Make scripts executable
chmod +x docker-run.sh docker-logs.sh

# Build and start all services
./docker-run.sh

# Access the application
open http://localhost:5000
```

### Manual Setup

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

## Service Commands

### Building Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build user-service

# Build without cache (recommended for updates)
docker-compose build --no-cache
```

### Starting Services

```bash
# Start all services in background
docker-compose up -d

# Start with live logs
docker-compose up --build

# Start specific services only
docker-compose up user-service cafe-service menu-service
```

### Monitoring and Debugging

```bash
# View all service logs
./docker-logs.sh

# View specific service logs
./docker-logs.sh user-service

# Check service health
curl http://localhost:8001/health  # User Service
curl http://localhost:8002/health  # Cafe Service
curl http://localhost:8003/health  # Menu Service
curl http://localhost:8004/health  # Feedback Service
curl http://localhost:8005/health  # Admin Service

# View running containers
docker-compose ps

# View resource usage
docker stats
```

### Stopping and Cleanup

```bash
# Stop all services
docker-compose down

# Stop and remove everything
docker-compose down -v --rmi all

# Clean up Docker system
docker system prune -a
```

## Database Configuration

The system uses **SQLite** with a shared database file:

- **Database File**: `shared_microservices.db`
- **Location**: Project root directory
- **Shared Access**: All microservices connect to the same SQLite file
- **Persistence**: Database is mounted as a volume in containers

### Database Management

```bash
# View database file
ls -la shared_microservices.db

# Access database directly (if sqlite3 installed)
sqlite3 shared_microservices.db

# Reset database (removes all data)
rm shared_microservices.db
docker-compose restart
```

## Environment Variables

### All Services
- `DATABASE_URL`: `sqlite:///shared_microservices.db`
- `SECRET_KEY`: `corporate-food-ordering-secret-key-2025`

### Service-Specific Ports
- `SERVICE_PORT`: 8001 (User), 8002 (Cafe), 8003 (Menu), 8004 (Feedback), 8005 (Admin)

### Client
- `NODE_ENV`: development

## Application Access

Once running, access the application at:
- **Frontend**: http://localhost:5000
- **User Service API**: http://localhost:8001
- **Cafe Service API**: http://localhost:8002
- **Menu Service API**: http://localhost:8003
- **Feedback Service API**: http://localhost:8004
- **Admin Service API**: http://localhost:8005

## Login Credentials

### Test Users (All passwords: `password123`)

**Cafe Owners:**
- alice / alice@cafe.com
- bob / bob@cafe.com
- carol / carol@cafe.com

**Employees:**
- john / john@company.com
- jane / jane@company.com
- mike / mike@company.com

**Super Admin:**
- admin / admin@system.com

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :5000
   lsof -i :8001
   
   # Kill conflicting processes
   sudo lsof -t -i :5000 | xargs kill -9
   ```

2. **Database Permission Issues**
   ```bash
   # Fix database file permissions
   chmod 664 shared_microservices.db
   
   # Recreate database
   rm shared_microservices.db
   touch shared_microservices.db
   chmod 664 shared_microservices.db
   ```

3. **Service Connection Issues**
   ```bash
   # Restart specific service
   docker-compose restart user-service
   
   # Check service logs
   docker-compose logs user-service
   ```

4. **Frontend Build Issues**
   ```bash
   # Clear node_modules and rebuild
   docker-compose down
   docker-compose build --no-cache client
   docker-compose up client
   ```

### Debug Commands

```bash
# Enter running container
docker-compose exec user-service bash

# View service environment
docker-compose exec user-service env

# Check network connectivity
docker-compose exec user-service ping cafe-service

# View container filesystem
docker-compose exec user-service ls -la /app
```

## Development Workflow

### Making Code Changes

```bash
# Services auto-reload with volume mounts
# Edit files in services/ directory
# Changes are reflected immediately

# For frontend changes
# Edit files in client/src/
# Vite will hot-reload automatically
```

### Adding New Dependencies

```bash
# For Python services
# Edit services/[service-name]/requirements.txt
# Rebuild the service
docker-compose build service-name --no-cache

# For frontend
# Edit client/package.json
# Rebuild client
docker-compose build client --no-cache
```

### Testing Changes

```bash
# Test specific service
curl http://localhost:8001/health

# Run database scripts
docker-compose exec user-service python ../scripts/populate_shared_db.py

# View application logs
./docker-logs.sh user-service
```

## Production Deployment

### Build Production Images

```bash
# Build optimized images
docker-compose build --no-cache

# Tag for registry
docker tag workspace_user-service:latest myregistry/food-ordering-user:latest

# Push to registry
docker push myregistry/food-ordering-user:latest
```

### Security Considerations

1. **Change Secret Keys**: Update `SECRET_KEY` environment variables
2. **Database Security**: Use PostgreSQL with proper authentication in production
3. **Network Security**: Configure proper firewall rules
4. **SSL/TLS**: Add HTTPS termination
5. **Environment Files**: Use `.env` files for sensitive data

## Performance Optimization

### Resource Limits

Add to docker-compose.yml:
```yaml
services:
  user-service:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Scaling

```bash
# Scale services horizontally
docker-compose up --scale user-service=2 --scale cafe-service=2

# Use load balancer for production scaling
```

## Useful Scripts

### Database Population

```bash
# Populate with test data
docker-compose exec user-service python /app/../scripts/populate_shared_db.py

# Add comprehensive data
docker-compose exec user-service python /app/../scripts/add_comprehensive_data.py
```

### Log Management

```bash
# View logs by service type
docker-compose logs | grep "user-service"
docker-compose logs | grep "ERROR"

# Export logs
docker-compose logs > application.log
```

---

For more information, see the main [README.md](README.md) and [replit.md](replit.md) files.