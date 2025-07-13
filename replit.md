# Corporate Food Ordering System

## Overview

This is a FastAPI-based corporate food ordering system that connects employees with cafe owners within a corporate environment. The system allows cafe owners to manage their cafes and menus, while employees can browse available food options and place orders.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Architecture Pattern
- **Microservices Architecture**: Distributed system with 6 independent services
- **API Gateway**: Nginx-based gateway for request routing and load balancing
- **Service Independence**: Each service deployable and scalable separately
- **Fault Isolation**: Service failures don't cascade to other services

### Backend Framework
- **FastAPI**: Modern, fast Python web framework for building APIs (Port: 8000 - monolith, Ports: 5001-5007 - microservices)
- **SQLAlchemy**: SQL toolkit and Object-Relational Mapping (ORM) library
- **Pydantic**: Data validation and serialization using Python type annotations

### Microservices Architecture
- **User Service (Port 5001)**: Authentication, user management, and profile handling
- **Cafe Service (Port 5002)**: Cafe creation, management, and owner validation
- **Menu Service (Port 5003)**: Menu items, categories, and inventory management
- **Order Service (Port 5004)**: Order processing, tracking, and status management
- **Payment Service (Port 5006)**: Payment processing and transaction simulation
- **Notification Service (Port 5007)**: Real-time WebSocket notifications and alerts
- **API Gateway (Port 80)**: Nginx gateway with rate limiting and CORS support

### Frontend Framework
- **React 19**: Modern JavaScript library for building user interfaces (Port: 5000)
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing for single-page applications
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: Reusable React components built with Radix UI and Tailwind

### Authentication & Security
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
- **OAuth2 Password Bearer**: Standard OAuth2 implementation for token-based auth
- **bcrypt**: Password hashing for secure credential storage
- **Jose**: JWT token encoding/decoding library

### Database Layer
- **SQLAlchemy ORM**: Database abstraction layer
- **PostgreSQL**: Production database with full relational features
- **Session Management**: Database session handling with dependency injection
- **Service Isolation**: Each microservice can have its own database

### State Management
- **React Context**: Authentication state management
- **Zustand**: Global state management for shopping cart
- **React Query**: Server state management and caching

### Deployment & DevOps
- **Docker**: Containerization for all services and components
- **Docker Compose**: Multi-container orchestration and service coordination
- **Nginx**: Reverse proxy, load balancing, and API gateway
- **Health Checks**: Service monitoring and health verification
- **Automated Scripts**: Build, deploy, and management automation

## Key Components

### User Management
- **Two User Types**: Cafe owners and employees with role-based access control
- **Registration/Login**: User authentication with JWT token generation
- **Middleware Protection**: Route protection based on user roles
- **Frontend Authentication**: Context-based auth state with protected routes

### Cafe Management
- **Cafe Creation**: Cafe owners can create and manage their cafes
- **Menu Management**: Support for menu items and categories (partial implementation)
- **Ownership Validation**: Ensures cafe owners can only manage their own cafes

### Order Processing
- **Order Creation**: Employees can place orders from available cafes
- **Order Tracking**: Support for order status management with real-time updates
- **Validation**: Menu item availability and cafe status validation
- **Shopping Cart**: Persistent cart state with item management

### Core Models
- **User**: Stores user credentials, roles, and profile information
- **Cafe**: Cafe details with owner relationships
- **Order/OrderItem**: Order management with status tracking
- **MenuItem/Category**: Menu structure (referenced but not fully implemented)

## Data Flow

### Authentication Flow
1. User registers with email, username, password, and role
2. User logs in with credentials
3. System validates credentials and returns JWT token
4. Token is used for subsequent authenticated requests
5. Middleware validates token and extracts user information

### Order Flow
1. Employee browses available cafes
2. Employee selects menu items from a cafe
3. System validates menu items and cafe availability
4. Order is created with unique order number
5. Order status can be tracked and updated

### Access Control
- **Cafe Owner Routes**: Protected by `get_current_cafe_owner` middleware
- **Employee Routes**: Protected by `get_current_employee` middleware
- **General Routes**: Protected by `get_current_user` middleware

## External Dependencies

### Python Libraries
- **FastAPI**: Web framework and API documentation
- **SQLAlchemy**: Database ORM and session management
- **Pydantic**: Data validation and serialization
- **python-jose**: JWT token handling
- **passlib**: Password hashing with bcrypt
- **uvicorn**: ASGI server for running the application

### Development Tools
- **CORS Middleware**: Cross-origin resource sharing support
- **Environment Variables**: Configuration management for secrets and database URLs

## Deployment Strategy

### Environment Configuration
- **SECRET_KEY**: JWT signing key (configurable via environment)
- **DATABASE_URL**: Fixed to SQLite file (food_ordering.db)
- **Token Expiration**: Configurable access token lifetime (30 minutes default)

### Database Setup
- **PostgreSQL**: Production-ready relational database with Docker
- **Shared Database**: All microservices connect to the same PostgreSQL instance
- **Auto-migration**: Database tables created automatically on service startup
- **Data Persistence**: Database data persisted in Docker volumes

### Microservices Configuration
- **Service Ports**: 5001-5007 for individual microservices
- **API Gateway**: Port 80 for unified access through Nginx
- **Health Checks**: Each service provides /health endpoint for monitoring
- **Docker Deployment**: Full containerization with Docker Compose orchestration

### UI/UX Design
- **Mobile-First**: Responsive design optimized for mobile devices
- **Two Distinct Themes**: 
  - Employee Side: Warm, appetizing colors (red, orange, green) with Burger King-style aesthetic
  - Cafe Owner Side: Professional colors (emerald, gray, amber) with clean admin interface
- **Touch-Friendly**: Large buttons and touch targets for mobile interaction
- **Component Library**: Custom shadcn/ui components with theme variants

### Recent Changes (July 2025)
- ✅ **FRESH DATABASE IMPLEMENTATION**: Completely rebuilt SQLite database with comprehensive test data
- ✅ **13 User Accounts**: 5 cafe owners (alice, bob, carol, sum1, anil) and 8 employees with password: password123
- ✅ **4 Active Cafes**: Coffee Central, Quick Lunch, Fresh & Green, International Flavors with real menu items
- ✅ **8 Food Categories**: Complete category system (Coffee & Tea, Breakfast, Sandwiches, Salads, etc.)
- ✅ **13+ Menu Items**: Real items with proper pricing, inventory tracking, and preparation times
- ✅ **SQLite Architecture**: All microservices now use shared SQLite database for consistency
- ✅ **COMPLETE DATABASE INTEGRATION**: All endpoints now use real SQLite database instead of dummy data
- ✅ **Cafe Owner Dashboards**: Show real cafes from database (Alice: 3 cafes, Bob: 1 cafe, Carol: 1 cafe)
- ✅ **Employee Dashboards**: Display all active cafes with real menu counts from database
- ✅ **Full CRUD Operations**: Create, Read, Update, Delete for cafes, menu items, categories, and orders
- ✅ **Real-time Data**: Menu items, categories, orders all stored and retrieved from actual database
- ✅ **Complete API Integration**: All frontend screens now interact with real database through comprehensive API endpoints
- ✅ Complete React frontend implementation with mobile-first design
- ✅ Employee interface with cafe browsing, menu viewing, cart, and order tracking
- ✅ Cafe owner interface with dashboard and management sections
- ✅ Authentication system with JWT tokens and protected routes
- ✅ Shopping cart with persistent state management
- ✅ Responsive design with custom color themes for each user type
- ✅ Project reorganized into client/server folder structure
- ✅ Server running on port 5000 with FastAPI and all routes configured
- ✅ Client configured with Vite, React, and Tailwind CSS on port 3000
- ✅ **Latest Updates**: Complete menu item CRUD operations, category creation, advanced filtering, and order cancellation features
- ✅ **LOGIN ISSUE RESOLVED**: Added missing employee users to database and verified authentication works for both cafe owners and employees
- ✅ **Menu Management**: Complete CRUD operations for cafe owners with modal forms
- ✅ **Order Management**: Full order status updates with estimated preparation time
- ✅ **Order Placement**: Fixed error handling and validation issues
- ✅ **API Integration**: All endpoints properly connected and functional
- ✅ **Enhanced Menu Management**: Edit and delete menu items functionality with confirmation dialogs
- ✅ **Category Management**: Create categories directly from cafe management page
- ✅ **Advanced Filtering**: Complete filter page for employees with price range and availability filters
- ✅ **Order Cancellation**: Full cancel order functionality for pending orders
- ✅ **Auto-Login**: Users automatically logged in after registration without re-login requirement
- ✅ **UI Improvements**: Removed time display from menu items, added cart confirmation messages, removed delivery fees
- ✅ **Stock Management**: Zero-stock items hidden from employee view
- ✅ **Cafe Selection**: Menu dashboard now prompts cafe selection before redirecting to management
- ✅ **Real-time Notifications**: Complete WebSocket implementation for instant updates
- ✅ **Bidirectional Updates**: Order status changes notify both cafe owners and employees
- ✅ **Real-time Stock Updates**: Menu item stock changes instantly reflected across all employee views
- ✅ **Visual Indicators**: Live connection status with animated indicators
- ✅ **Mock Payment System**: Complete free payment simulation for college demonstrations
- ✅ **Payment Integration**: Multiple payment methods with realistic success/failure scenarios
- ✅ **Fixed Order Creation Flow**: Orders now only created AFTER successful payment completion
- ✅ **Cancelled Order Protection**: Cafe owners cannot update status of cancelled orders
- ✅ **Refund Notifications**: When cafe owners cancel orders, employees see "Refund Initiated" message
- ✅ **Unified Authentication System**: Single auth page with role toggle instead of separate login boxes
- ✅ **Modern UI Design**: Professional gradient color scheme and improved visual design
- ✅ **Enhanced Real-time Notifications**: Complete WebSocket integration with visual and audio alerts
- ✅ **Complete Dark/Light Mode System**: Full theme toggle implementation with ThemeContext and theme-toggle components
- ✅ **Mobile-First Theme Integration**: Theme toggles added to all dashboards with mobile-optimized touch targets
- ✅ **MICROSERVICES ARCHITECTURE**: Complete transformation from monolithic to microservices architecture
- ✅ **6 Independent Services**: User, Cafe, Menu, Order, Payment, and Notification services
- ✅ **API Gateway**: Nginx-based gateway with load balancing and rate limiting
- ✅ **Docker Integration**: Full Docker Compose setup with individual Dockerfiles
- ✅ **Deployment Scripts**: Automated build, deploy, and management scripts
- ✅ **Service Independence**: Each service can be deployed and scaled independently
- ✅ **PROJECT CLEANUP**: Removed monolithic server folder and unnecessary files
- ✅ **Clean Architecture**: Streamlined project structure with only essential microservices components
- ✅ **DOCKER INTEGRATION**: Complete Docker setup with simplified and full microservices configurations
- ✅ **Docker Scripts**: One-click build/start/stop scripts for easy deployment and management
- ✅ **Container Documentation**: Comprehensive Docker setup guide with troubleshooting instructions
- ✅ **COMPREHENSIVE FEEDBACK SYSTEM**: Complete customer feedback system with database models, API endpoints, and UI components
- ✅ **Feedback Service Architecture**: Dedicated microservice running on port 8004 with full CRUD operations for order feedback
- ✅ **Employee Feedback Interface**: Integrated feedback prompts in order tracking with star ratings and comment system
- ✅ **Cafe Owner Analytics**: Feedback management page with detailed analytics, rating distribution, and customer reviews
- ✅ **Real-time Feedback Notifications**: Dashboard notifications for pending feedback requests
- ✅ **COMPLETE BUG FIXES (January 2025)**: Fixed all 8 critical issues including menu item creation, theme consistency, search functionality, and notification system
- ✅ **Menu Item Creation Fix**: Added missing cafe_id field to MenuItemCreate model in menu service
- ✅ **Theme Consistency**: Fixed background gradients across all pages - Employee (green), Owner (orange), Admin (blue)
- ✅ **Enhanced Search**: Real-time search with 500ms debounce and instant result updates
- ✅ **Admin Dashboard**: Updated design to match employee and owner interface styles
- ✅ **Toast Notifications**: Fixed X button functionality and 5-second auto-dismiss
- ✅ **Category Management**: Fixed category filtering for new cafes without menu items
- ✅ **Auth Page**: Fixed dark mode toggle and theme consistency across user type selection
- ✅ **Complete Testing**: All functionality verified and working across all user types
- ✅ **Multi-Device Login Fix (January 2025)**: Extended JWT token expiration from 30 minutes to 7 days for better multi-device authentication experience
- ✅ **Dark Mode Toast Fix (January 2025)**: Fixed error message toast notifications to properly respect dark/light mode themes with correct colors and backgrounds
- ✅ **Employee Background Update (January 2025)**: Changed employee page backgrounds from yellowish-green gradient to clean white background across all employee pages for better visual appearance
- ✅ **Employee Interface Styling Update (January 2025)**: Updated employee interface with white backgrounds for input fields, buttons, and theme toggles, while making search and add-to-cart buttons dark gray for better contrast and usability
- ✅ **Category Filtering Fix (January 2025)**: Fixed cafe menu category filtering by adding category_id parameter support to backend menu endpoint, enabling proper menu item filtering when categories are selected
- ✅ **Feedback Notification Enhancement (January 2025)**: Made feedback notifications dismissible with X button and "Maybe Later" option to reduce dashboard distractions and improve user experience
- ✅ **Complete Docker Infrastructure Update (January 2025)**: Updated all Dockerfiles and docker-compose.yml for current microservices architecture with proper port configuration (8001-8005), SQLite database mounting, and automated build scripts

### Completed Features
- **User Authentication**: JWT-based login system for employees and cafe owners
- **Cafe Management**: Create and manage cafe profiles with owner validation
- **Menu Management**: Add, edit, delete menu items with category support
- **Order System**: Complete order placement, tracking, and status management
- **Order Status Updates**: Real-time order processing by cafe owners with preparation time estimates
- **Shopping Cart**: Persistent cart state with quantity management
- **Advanced Search**: Global food search across all cafes with filtering
- **Mock Payment System**: Complete free payment simulation with multiple payment methods
- **Payment Flow**: Order creation followed by payment processing with realistic success/failure rates
- **Error Handling**: Robust error handling with user-friendly messages
- **Mobile-First Design**: Responsive interface optimized for all devices
- **Complete Dark/Light Mode**: Theme toggle system with persistent state and dark mode support
- **Microservices Architecture**: Complete transformation to distributed system architecture
- **Service Independence**: All 6 microservices deployable and scalable independently
- **API Gateway**: Nginx-based routing with load balancing and rate limiting
- **Docker Integration**: Full containerization with Docker Compose orchestration
- **Deployment Automation**: Automated build, deploy, and management scripts

### Microservices Benefits Achieved
- **Service Independence**: Each service can be developed, deployed, and scaled separately
- **Fault Isolation**: Failures in one service don't affect others
- **Technology Diversity**: Services can use different technologies and frameworks
- **Team Autonomy**: Different teams can work on different services independently
- **Horizontal Scaling**: Scale only the services that need more resources
- **Continuous Deployment**: Deploy updates to individual services without system downtime

### Deployment Options
- **Docker Compose (Recommended)**: `./scripts/build.sh && ./scripts/deploy.sh`
- **Development Mode**: `./scripts/run-microservices.sh`
- **Individual Services**: `cd services/[service-name] && python main.py`
- **Production**: Deploy containers to cloud platforms (AWS, Azure, GCP)

### Incomplete Features
- **Service Mesh**: Advanced service-to-service communication with Istio
- **Enhanced Real-time Features**: Push notifications for mobile devices
- **Advanced Analytics**: Sales reporting and analytics for cafe owners
- **Auto-scaling**: Kubernetes-based auto-scaling based on load
- **Distributed Tracing**: Request tracing across microservices

The system follows a clean architecture pattern with clear separation between authentication, business logic, and data access layers. The modular route structure makes it easy to extend functionality for each user type.