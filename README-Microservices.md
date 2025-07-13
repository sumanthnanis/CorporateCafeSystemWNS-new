# Corporate Food Ordering System - Microservices Architecture

## Overview

This document describes the microservices architecture implementation of the Corporate Food Ordering System using Docker and Docker Compose. The system has been successfully transformed from a monolithic architecture to 6 independent microservices with an API Gateway for routing and load balancing.

## Project Structure

```
├── client/                 # React frontend (port 5000)
│   ├── src/               # Frontend source code
│   ├── Dockerfile         # Frontend container config
│   └── package.json       # Frontend dependencies
├── services/              # Microservices directory
│   ├── user-service/      # Authentication & user management (port 5001)
│   ├── cafe-service/      # Cafe management (port 5002)
│   ├── menu-service/      # Menu & categories (port 5003)
│   ├── order-service/     # Order processing (port 5004)
│   ├── payment-service/   # Payment simulation (port 5006)
│   └── notification-service/ # WebSocket notifications (port 5007)
├── gateway/               # API Gateway
│   └── nginx.conf         # Nginx configuration
├── scripts/               # Deployment scripts
│   ├── build.sh          # Build all containers
│   ├── deploy.sh         # Deploy services
│   ├── stop.sh           # Stop all services
│   └── run-microservices.sh # Development mode
├── docker-compose.yml     # Multi-service orchestration
└── README-Microservices.md # This file
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   API Gateway    │    │   Microservices     │
│   (React)       │◄──►│   (Nginx)        │◄──►│                     │
│   Port: 3000    │    │   Port: 80       │    │  User Service       │
└─────────────────┘    └──────────────────┘    │  Cafe Service       │
                                               │  Menu Service       │
                                               │  Order Service      │
                                               │  Payment Service    │
                                               │  Notification       │
                                               └─────────────────────┘
                                                        │
                                               ┌─────────────────────┐
                                               │   PostgreSQL        │
                                               │   Database          │
                                               │   Port: 5432        │
                                               └─────────────────────┘
```

## Microservices

### 1. User Management Service (Port: 5001)
- **Responsibilities**: Authentication, user registration, JWT token management
- **Endpoints**: `/register`, `/login`, `/me`, `/verify-token`
- **Database Tables**: `users`

### 2. Cafe Management Service (Port: 5002)
- **Responsibilities**: Cafe creation, management, ownership validation
- **Endpoints**: `/cafes`, `/cafes/{id}`, `/cafes/public/all`
- **Database Tables**: `cafes`

### 3. Menu Management Service (Port: 5003)
- **Responsibilities**: Menu items, categories, inventory management
- **Endpoints**: `/categories`, `/menu-items`, `/menu-items/filter`
- **Database Tables**: `categories`, `menu_items`

### 4. Order Management Service (Port: 5004)
- **Responsibilities**: Order creation, tracking, status updates
- **Endpoints**: `/orders`, `/orders/my`, `/cafe-orders`, `/orders/{id}/status`
- **Database Tables**: `orders`, `order_items`

### 5. Payment Processing Service (Port: 5006)
- **Responsibilities**: Payment simulation, refunds, transaction management
- **Endpoints**: `/process-payment`, `/payment-methods`, `/refund`
- **Features**: Multiple payment methods, realistic success/failure rates

### 6. Notification Service (Port: 5007)
- **Responsibilities**: Real-time WebSocket notifications, event broadcasting
- **Endpoints**: `/ws/{user_type}`, `/notify/order-status`, `/notify/new-order`
- **Features**: Real-time order updates, menu changes, payment notifications

## API Gateway

The Nginx-based API Gateway provides:

- **Load Balancing**: Routes requests to healthy service instances
- **Rate Limiting**: 10 requests per second per IP
- **CORS Handling**: Cross-origin resource sharing for frontend
- **SSL Termination**: Ready for HTTPS certificates
- **Health Checks**: Monitors service availability

### Gateway Routes

| Route | Target Service | Description |
|-------|---------------|-------------|
| `/api/auth/*` | User Service | Authentication endpoints |
| `/api/cafes/*` | Cafe Service | Cafe management |
| `/api/menu/*` | Menu Service | Menu and categories |
| `/api/orders/*` | Order Service | Order management |
| `/api/payments/*` | Payment Service | Payment processing |
| `/api/ws/*` | Notification Service | WebSocket connections |
| `/*` | Frontend | React application |

## Database

- **PostgreSQL 16**: Production-ready relational database
- **Shared Database**: All services connect to the same database instance
- **Auto-Migration**: Tables created automatically on service startup
- **Data Persistence**: Database data persisted in Docker volume

## Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 8GB+ RAM recommended
- Ports 80, 3000, 5001-5007, 5432 available

### Quick Start

1. **Build all services:**
   ```bash
   ./scripts/build.sh
   ```

2. **Deploy the system:**
   ```bash
   ./scripts/deploy.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost

### Manual Deployment

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down
```

## Monitoring

### Service Health Checks

Each service provides a `/health` endpoint:

```bash
# Check individual services
curl http://localhost:5001/health  # User Service
curl http://localhost:5002/health  # Cafe Service
curl http://localhost:5003/health  # Menu Service
curl http://localhost:5004/health  # Order Service
curl http://localhost:5006/health  # Payment Service
curl http://localhost:5007/health  # Notification Service

# Check API Gateway
curl http://localhost/health
```

### Logging

```bash
# View all service logs
./scripts/logs.sh all

# View specific service logs
./scripts/logs.sh user-service
./scripts/logs.sh order-service

# Real-time monitoring
docker-compose logs -f
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d food_ordering

# View tables
\dt

# Query users
SELECT * FROM users;
```

## Development

### Adding New Services

1. Create service directory: `services/new-service/`
2. Add Dockerfile and requirements.txt
3. Copy shared files (auth.py, models.py, etc.)
4. Create main.py with FastAPI application
5. Update docker-compose.yml
6. Add routes to nginx.conf

### Service Communication

Services communicate via HTTP APIs:

```python
# Example: Order Service calling User Service
import requests

user_response = requests.get(
    f"{USER_SERVICE_URL}/users/{user_id}",
    headers={"Authorization": f"Bearer {token}"}
)
```

### Environment Variables

Each service uses these environment variables:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/food_ordering
SECRET_KEY=your-secret-key-here
SERVICE_PORT=5001
USER_SERVICE_URL=http://user-service:5001
CAFE_SERVICE_URL=http://cafe-service:5002
# ... other service URLs
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml - Scale specific services
services:
  order-service:
    scale: 3  # Run 3 instances
    # ... configuration
```

### Load Balancing

Nginx automatically load balances between service instances:

```nginx
upstream order-service {
    server order-service_1:5004;
    server order-service_2:5004;
    server order-service_3:5004;
}
```

## Security

- **JWT Authentication**: Stateless token-based authentication
- **Rate Limiting**: 10 requests/second per IP via Nginx
- **Input Validation**: Pydantic schemas validate all inputs
- **Database Security**: PostgreSQL with authentication
- **Network Isolation**: Services communicate within Docker network

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using ports
   lsof -i :5001
   
   # Stop conflicting services
   sudo systemctl stop nginx  # If port 80 is used
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL container
   docker-compose logs postgres
   
   # Restart database
   docker-compose restart postgres
   ```

3. **Service Not Starting**
   ```bash
   # View service logs
   docker-compose logs [service-name]
   
   # Rebuild specific service
   docker-compose build --no-cache [service-name]
   ```

4. **Gateway Routing Issues**
   ```bash
   # Test gateway config
   docker-compose exec api-gateway nginx -t
   
   # Reload gateway
   docker-compose restart api-gateway
   ```

### Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried fields
2. **Caching**: Implement Redis for session/data caching
3. **Connection Pooling**: Configure database connection pools
4. **Async Processing**: Use message queues for heavy operations

## Production Considerations

1. **SSL Certificates**: Configure HTTPS in Nginx
2. **Environment Secrets**: Use Docker secrets or external secret management
3. **Database Backup**: Implement automated PostgreSQL backups
4. **Monitoring**: Add Prometheus/Grafana for metrics
5. **Logging**: Centralized logging with ELK stack
6. **CI/CD**: Automated testing and deployment pipelines

## Migration from Monolith

The system has been successfully migrated from a monolithic architecture to microservices while maintaining all existing functionality:

- ✅ User authentication and authorization
- ✅ Cafe management and ownership
- ✅ Menu item CRUD operations
- ✅ Order placement and tracking
- ✅ Payment processing simulation
- ✅ Real-time notifications via WebSocket
- ✅ Mobile-responsive frontend
- ✅ Dark/light mode themes

All existing features work seamlessly through the new microservices architecture.