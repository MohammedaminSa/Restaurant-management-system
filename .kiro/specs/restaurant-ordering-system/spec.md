# Smart Restaurant Menu & Ordering System

## Overview
A modern, web-based Progressive Web App (PWA) restaurant ordering system that enables customers to scan QR codes at tables, browse menus, customize orders, and submit them directly to the kitchen. The system provides separate interfaces for customers, kitchen staff, waiters, cashiers, and administrators with real-time order management, inventory tracking, and analytics.

## Goals
- Replace or complement traditional waiter-based ordering
- Reduce order errors and waiting times
- Improve customer experience and service efficiency
- Provide comprehensive restaurant management tools
- Support multi-restaurant operations
- Enable offline-capable, installable PWA experience

## Design

### System Architecture

#### Tech Stack
**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- Progressive Web App (PWA) with service workers
- Real-time updates via WebSocket/Server-Sent Events
- Responsive design for mobile, tablet, and desktop

**Backend:**
- Node.js with Express.js
- TypeScript
- PostgreSQL for relational data
- Redis for caching and real-time features
- WebSocket for real-time order updates
- JWT for authentication
- Cloudinary/S3 for image storage

**Infrastructure:**
- Docker containers for deployment
- Nginx for reverse proxy
- PM2 for process management

### Database Schema

#### Core Entities

**Users**
- id (UUID, PK)
- email (unique)
- password_hash
- role (ENUM: admin, restaurant_admin, kitchen_staff, waiter, cashier)
- restaurant_id (FK, nullable for super admin)
- name
- phone
- avatar_url
- is_active
- created_at, updated_at

**Restaurants**
- id (UUID, PK)
- name
- slug (unique)
- description
- logo_url
- address
- phone
- email
- timezone
- currency
- tax_rate
- service_charge_rate
- is_active
- opening_hours (JSONB)
- settings (JSONB: features, payment methods, etc.)
- created_at, updated_at

**Tables**
- id (UUID, PK)
- restaurant_id (FK)
- table_number
- qr_code (unique)
- capacity
- location (area/floor)
- status (ENUM: available, occupied, reserved, maintenance)
- current_session_id (FK, nullable)
- created_at, updated_at

**Categories**
- id (UUID, PK)
- restaurant_id (FK)
- name
- description
- image_url
- display_order
- is_active
- parent_category_id (FK, nullable - for subcategories)
- created_at, updated_at

**MenuItems**
- id (UUID, PK)
- restaurant_id (FK)
- category_id (FK)
- name
- description
- image_url
- base_price
- preparation_time (minutes)
- is_available
- is_featured
- dietary_info (JSONB: vegetarian, vegan, gluten_free, etc.)
- allergens (JSONB)
- nutritional_info (JSONB)
- display_order
- created_at, updated_at

**ItemVariants**
- id (UUID, PK)
- menu_item_id (FK)
- name (e.g., "Size", "Spice Level")
- type (ENUM: single_select, multi_select)
- is_required
- display_order

**VariantOptions**
- id (UUID, PK)
- variant_id (FK)
- name (e.g., "Small", "Medium", "Large")
- price_modifier (can be negative, positive, or zero)
- is_default
- display_order

**OrderSessions**
- id (UUID, PK)
- restaurant_id (FK)
- table_id (FK)
- session_token (unique)
- customer_name (optional)
- customer_phone (optional)
- status (ENUM: active, completed, cancelled)
- started_at
- completed_at

**Orders**
- id (UUID, PK)
- restaurant_id (FK)
- session_id (FK)
- order_number (unique per restaurant, auto-increment)
- status (ENUM: pending, confirmed, preparing, ready, served, cancelled)
- order_type (ENUM: dine_in, takeaway, delivery)
- subtotal
- tax_amount
- service_charge
- discount_amount
- total_amount
- special_instructions
- created_by_user_id (FK, nullable - if placed by waiter)
- assigned_to_waiter_id (FK, nullable)
- created_at
- updated_at
- confirmed_at
- completed_at

**OrderItems**
- id (UUID, PK)
- order_id (FK)
- menu_item_id (FK)
- quantity
- unit_price
- selected_variants (JSONB)
- special_instructions
- status (ENUM: pending, preparing, ready, served, cancelled)
- total_price

**Inventory**
- id (UUID, PK)
- restaurant_id (FK)
- item_name
- unit (kg, liters, pieces, etc.)
- current_quantity
- minimum_quantity
- unit_cost
- supplier_name
- last_restocked_at
- created_at, updated_at

**InventoryTransactions**
- id (UUID, PK)
- inventory_id (FK)
- transaction_type (ENUM: restock, consumption, adjustment, wastage)
- quantity_change
- notes
- created_by_user_id (FK)
- created_at

**Promotions**
- id (UUID, PK)
- restaurant_id (FK)
- name
- description
- discount_type (ENUM: percentage, fixed_amount)
- discount_value
- minimum_order_amount
- applicable_items (JSONB: array of menu_item_ids or "all")
- start_date
- end_date
- is_active
- usage_limit
- usage_count
- created_at, updated_at

**Payments**
- id (UUID, PK)
- restaurant_id (FK)
- session_id (FK)
- amount
- payment_method (ENUM: cash, card, digital_wallet, online)
- status (ENUM: pending, completed, failed, refunded)
- transaction_id (external payment gateway)
- created_at
- completed_at

### API Endpoints

#### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
```

#### Customer (Public + Session-based)
```
GET    /api/customer/restaurant/:slug
GET    /api/customer/table/:qrCode
POST   /api/customer/session/start
GET    /api/customer/menu/:restaurantId
GET    /api/customer/menu/categories/:restaurantId
GET    /api/customer/menu/item/:itemId
POST   /api/customer/order
GET    /api/customer/order/:sessionId
GET    /api/customer/order/:orderId/status
POST   /api/customer/order/:orderId/cancel
```

#### Kitchen Staff
```
GET    /api/kitchen/orders/pending
GET    /api/kitchen/orders/preparing
PATCH  /api/kitchen/order/:orderId/status
PATCH  /api/kitchen/order-item/:itemId/status
GET    /api/kitchen/menu/items (for checking availability)
```

#### Waiter
```
GET    /api/waiter/tables
GET    /api/waiter/table/:tableId/session
POST   /api/waiter/order (place order on behalf of customer)
GET    /api/waiter/orders/active
PATCH  /api/waiter/order/:orderId/status
POST   /api/waiter/table/:tableId/assign
GET    /api/waiter/assigned-tables
```

#### Cashier
```
GET    /api/cashier/sessions/active
GET    /api/cashier/session/:sessionId/orders
POST   /api/cashier/payment
GET    /api/cashier/payment/:paymentId
POST   /api/cashier/invoice/:sessionId/generate
GET    /api/cashier/transactions/today
```

#### Restaurant Admin
```
# Menu Management
GET    /api/admin/menu/items
POST   /api/admin/menu/item
PUT    /api/admin/menu/item/:itemId
DELETE /api/admin/menu/item/:itemId
PATCH  /api/admin/menu/item/:itemId/availability

# Category Management
GET    /api/admin/categories
POST   /api/admin/category
PUT    /api/admin/category/:categoryId
DELETE /api/admin/category/:categoryId

# Table Management
GET    /api/admin/tables
POST   /api/admin/table
PUT    /api/admin/table/:tableId
DELETE /api/admin/table/:tableId
GET    /api/admin/table/:tableId/qr-code

# User Management
GET    /api/admin/users
POST   /api/admin/user
PUT    /api/admin/user/:userId
DELETE /api/admin/user/:userId

# Inventory Management
GET    /api/admin/inventory
POST   /api/admin/inventory/item
PUT    /api/admin/inventory/item/:itemId
POST   /api/admin/inventory/transaction
GET    /api/admin/inventory/low-stock

# Promotions
GET    /api/admin/promotions
POST   /api/admin/promotion
PUT    /api/admin/promotion/:promotionId
DELETE /api/admin/promotion/:promotionId

# Analytics & Reports
GET    /api/admin/analytics/sales
GET    /api/admin/analytics/popular-items
GET    /api/admin/analytics/orders-by-time
GET    /api/admin/analytics/revenue
GET    /api/admin/reports/daily-sales
GET    /api/admin/reports/inventory-usage

# Restaurant Settings
GET    /api/admin/restaurant/settings
PUT    /api/admin/restaurant/settings
```

#### Super Admin (Multi-Restaurant Management)
```
GET    /api/superadmin/restaurants
POST   /api/superadmin/restaurant
PUT    /api/superadmin/restaurant/:restaurantId
DELETE /api/superadmin/restaurant/:restaurantId
GET    /api/superadmin/analytics/all-restaurants
```

### Frontend Architecture

#### Route Structure
```
/                           - Landing page
/:restaurantSlug            - Restaurant home page
/table/:qrCode              - Customer menu interface
/login                      - Staff login
/dashboard                  - Role-based dashboard redirect

# Kitchen Interface
/kitchen/orders             - Active orders view
/kitchen/history            - Completed orders

# Waiter Interface
/waiter/tables              - Table management
/waiter/orders              - Active orders
/waiter/new-order           - Manual order placement

# Cashier Interface
/cashier/billing            - Active sessions
/cashier/payment            - Payment processing
/cashier/transactions       - Transaction history

# Admin Interface
/admin/dashboard            - Overview & analytics
/admin/menu                 - Menu management
/admin/categories           - Category management
/admin/tables               - Table management
/admin/inventory            - Inventory tracking
/admin/users                - User management
/admin/promotions           - Promotion management
/admin/reports              - Reports & analytics
/admin/settings             - Restaurant settings
```

#### Component Structure
```
src/
├── components/
│   ├── customer/
│   │   ├── MenuCard.tsx
│   │   ├── MenuItemDetail.tsx
│   │   ├── CartSheet.tsx
│   │   ├── OrderTracking.tsx
│   │   └── CategoryFilter.tsx
│   ├── kitchen/
│   │   ├── OrderCard.tsx
│   │   ├── OrderItemList.tsx
│   │   └── KitchenTimer.tsx
│   ├── waiter/
│   │   ├── TableGrid.tsx
│   │   ├── TableDetail.tsx
│   │   └── OrderForm.tsx
│   ├── cashier/
│   │   ├── SessionList.tsx
│   │   ├── PaymentForm.tsx
│   │   └── Invoice.tsx
│   ├── admin/
│   │   ├── MenuItemForm.tsx
│   │   ├── TableForm.tsx
│   │   ├── UserForm.tsx
│   │   ├── InventoryTable.tsx
│   │   ├── PromotionForm.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   └── SalesChart.tsx
│   ├── shared/
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ImageUpload.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       ├── ProtectedRoute.tsx
│       └── RoleGuard.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   ├── useCart.ts
│   ├── useOrders.ts
│   ├── useMenu.ts
│   └── useInventory.ts
├── contexts/
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   ├── RestaurantContext.tsx
│   └── WebSocketContext.tsx
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── customer.service.ts
│   ├── kitchen.service.ts
│   ├── waiter.service.ts
│   ├── cashier.service.ts
│   ├── admin.service.ts
│   └── websocket.service.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   ├── constants.ts
│   └── helpers.ts
├── types/
│   ├── user.types.ts
│   ├── menu.types.ts
│   ├── order.types.ts
│   ├── restaurant.types.ts
│   └── api.types.ts
└── pages/
    ├── CustomerMenu.tsx
    ├── KitchenDashboard.tsx
    ├── WaiterDashboard.tsx
    ├── CashierDashboard.tsx
    ├── AdminDashboard.tsx
    └── Login.tsx
```

### State Management Strategy

**Local State (useState):**
- Form inputs
- UI toggles (modals, dropdowns)
- Component-specific data

**Context API:**
- Authentication state
- Shopping cart
- Restaurant configuration
- WebSocket connections

**Server State (React Query or SWR):**
- API data fetching
- Cache management
- Background refetching
- Optimistic updates

### Real-Time Features

**WebSocket Events:**

*Customer → Server:*
- `customer:join-session` - Join order session
- `customer:place-order` - New order submission

*Server → Customer:*
- `order:status-update` - Order status changes
- `order:confirmed` - Order confirmed by kitchen/waiter

*Kitchen → Server:*
- `kitchen:update-status` - Update order/item status
- `kitchen:item-ready` - Item ready for serving

*Server → Kitchen:*
- `order:new` - New order received
- `order:cancelled` - Order cancelled

*Server → Waiter:*
- `order:ready` - Order ready for serving
- `table:status-change` - Table status updates

### PWA Features

**Service Worker:**
- Cache static assets
- Cache menu images
- Offline fallback pages
- Background sync for orders (queue when offline)

**Web App Manifest:**
- Install prompts
- Custom app icons
- Splash screens
- Display mode: standalone

**Offline Capabilities:**
- View cached menu when offline
- Queue orders for submission when back online
- Show offline indicator

### Security Considerations

1. **Authentication & Authorization:**
   - JWT tokens with refresh mechanism
   - Role-based access control (RBAC)
   - Session-based access for customers (no login required)

2. **Data Protection:**
   - HTTPS only
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - CSRF tokens
   - Rate limiting

3. **QR Code Security:**
   - Time-limited session tokens
   - QR codes tied to specific tables
   - Prevent session hijacking

4. **Payment Security:**
   - PCI DSS compliance for card payments
   - Encrypted payment data
   - Integration with secure payment gateways

### Performance Optimization

1. **Frontend:**
   - Code splitting
   - Lazy loading routes and images
   - Image optimization (WebP, responsive images)
   - Debounced search inputs
   - Virtual scrolling for long lists

2. **Backend:**
   - Database indexing
   - Redis caching for frequently accessed data
   - Connection pooling
   - Query optimization
   - CDN for static assets

3. **Real-time:**
   - WebSocket connection pooling
   - Event batching
   - Selective broadcasting

### Deployment Strategy

**Development:**
- Local Docker Compose setup
- Hot reload for frontend and backend

**Staging:**
- Docker containers on cloud platform
- CI/CD pipeline (GitHub Actions)
- Automated testing

**Production:**
- Containerized deployment
- Load balancer
- Auto-scaling
- Database backups
- Monitoring and logging
- Error tracking (Sentry)

## Key Features Summary

**Customer Features:**
- QR code menu access
- Browse menu by categories
- Search menu items
- View detailed item info (images, descriptions, allergens)
- Customize orders with variants
- Add items to cart
- Submit orders
- Track order status in real-time
- View session bill
- No account required

**Kitchen Staff Features:**
- View incoming orders by priority
- Update order status (preparing, ready)
- Mark individual items as complete
- View preparation time estimates
- See special instructions
- Filter orders by status

**Waiter Features:**
- View all tables and their status
- See assigned tables
- Place orders on behalf of customers
- View active orders
- Mark orders as served
- Update table status
- View customer session details

**Cashier Features:**
- View active sessions
- Generate bills/invoices
- Process payments (multiple methods)
- Print/email receipts
- View transaction history
- Handle refunds

**Admin Features:**
- Full menu management (CRUD)
- Category management
- Table management with QR generation
- User management (create staff accounts)
- Inventory tracking
- Promotion management
- Sales analytics and reports
- Restaurant settings configuration
- View real-time dashboard

**Multi-Restaurant (Super Admin):**
- Manage multiple restaurants
- Cross-restaurant analytics
- Central user management
- Franchise reporting

## Success Metrics

- Order placement time < 2 minutes
- Page load time < 2 seconds
- Real-time update latency < 500ms
- 99.9% uptime
- Support 100+ concurrent users per restaurant
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance
- PWA installability score > 90 (Lighthouse)
