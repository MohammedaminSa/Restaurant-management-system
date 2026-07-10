# Implementation Tasks

## Phase 1: Backend Foundation ✅ COMPLETE

### Backend Infrastructure
- [x] Initialize Node.js backend with TypeScript and Express
- [x] Set up PostgreSQL database with connection pooling
- [x] Configure Redis for caching (Optional - disabled by default)
- [x] Set up environment configuration (.env files)
- [x] Implement database schema with all 15 tables
- [x] Set up error handling middleware
- [x] Configure logging system (Morgan)
- [x] Set up Docker configuration for backend

### Authentication & User Management
- [x] Implement JWT token generation and verification
- [x] Create authentication middleware with RBAC
- [x] Build login API endpoint
- [x] Create user CRUD endpoints (6 endpoints)
- [x] Implement role-based access control (5 roles)
- [x] Add token refresh mechanism
- [x] Build password hashing with bcrypt

### Database Seeding
- [x] Create user seed script (5 test users)
- [x] Create restaurant seed data
- [x] Build demo data generators

---

## Phase 2: Menu & Table Management ✅ COMPLETE

### Menu System Backend
- [x] Create menu item model and database queries
- [x] Build category management system
- [x] Implement menu API endpoints (7 endpoints)
  - [x] GET /menu/categories
  - [x] GET /menu/items (with search, filter, pagination)
  - [x] GET /menu/items/:id (with variants)
  - [x] POST /menu/items (admin)
  - [x] PUT /menu/items/:id (admin)
  - [x] DELETE /menu/items/:id (admin)
  - [x] PATCH /menu/items/:id/toggle (admin)
- [x] Create menu item variants system
- [x] Implement search functionality
- [x] Add dietary/allergen filtering
- [x] Create menu seed script (21 demo items)

### Table Management Backend
- [x] Create table model and database
- [x] Build QR code generation with qrcode package
- [x] Implement table CRUD endpoints (8 endpoints)
  - [x] GET /tables
  - [x] GET /tables/:id
  - [x] POST /tables (admin)
  - [x] PUT /tables/:id (admin)
  - [x] DELETE /tables/:id (admin)
  - [x] PATCH /tables/:id/status
  - [x] GET /tables/:id/qr (generate QR image)
  - [x] GET /tables/scan/:qrCode (public)
- [x] Implement QR code scanning flow
- [x] Create table seed script (15 demo tables)

---

## Phase 2.5: Security Hardening ✅ COMPLETE

### Restaurant Access Control Completion
- [x] **Add restaurant access control to createTable()**
  - [x] Verify super_admin can create tables for any restaurant
  - [x] Verify restaurant_admin can only create tables for their assigned restaurant
  - [x] Prevent users from creating tables for other restaurants
  - [x] Return 403 Forbidden error if user tries to create table for wrong restaurant
- [x] **Add restaurant access control to updateTable()**
  - [x] Fetch table to verify it exists and get its restaurant_id
  - [x] Check if user's restaurant_id matches table's restaurant_id (skip for super_admin)
  - [x] Return 403 Forbidden error for cross-restaurant access attempts
- [x] **Add restaurant access control to deleteTable()**
  - [x] Fetch table with restaurant_id included in the query
  - [x] Verify table belongs to user's restaurant (skip for super_admin)
  - [x] Return 403 Forbidden error for cross-restaurant access attempts
- [x] **Add restaurant access control to generateQRCode()**
  - [x] Verify table belongs to user's restaurant before generating QR code
  - [x] Return 403 Forbidden error for cross-restaurant access attempts
- [x] **Add restaurant access control to updateTableStatus()**
  - [x] Fetch table with restaurant_id before updating status
  - [x] Verify table belongs to user's restaurant (skip for super_admin)
  - [x] Return 403 Forbidden error for cross-restaurant access attempts

---

## Phase 3: Order Session & Cart System ✅ COMPLETE

### Session Management Backend
- [x] Build session creation endpoint
  - [x] POST /sessions - Create session when QR scanned
  - [x] Link session to table
  - [x] Generate session token
  - [x] Set table status to 'occupied'
- [x] Create session validation middleware
- [x] Build session info endpoint
  - [x] GET /sessions/:token - Get active session
  - [x] Include table, restaurant, customer info
- [x] Implement session completion endpoint
  - [x] PATCH /sessions/:token/complete
  - [x] Set table back to 'available'
- [x] Add session timeout logic
- [x] Create session seed data (demo sessions)

### Order Placement Backend
- [x] Create order submission API
  - [x] POST /orders - Submit customer order
  - [x] Validate menu items exist and available
  - [x] Calculate subtotal, tax, service charge
  - [x] Generate unique order number
  - [x] Link order to session
- [x] Build order retrieval endpoints
  - [x] GET /orders/:id - Get order details
  - [x] GET /sessions/:token/orders - Get session orders
- [x] Implement order status updates
  - [x] PATCH /orders/:id/status
  - [x] Update timestamps (confirmed_at, completed_at)
- [x] Add special instructions field
- [x] Create order validation logic

---

## Phase 4: Kitchen & Waiter Interfaces ✅ COMPLETE

### Kitchen API
- [x] Build kitchen order listing API
  - [x] GET /kitchen/orders - List pending/preparing orders
  - [x] Filter by status (pending, preparing, ready)
  - [x] Order by priority and time
- [x] Create order status update for kitchen
  - [x] PATCH /kitchen/orders/:id/status
  - [x] Update to: preparing, ready
- [x] Implement item-level status tracking
  - [x] Track individual order items
- [x] Add order timer calculations

### Waiter API
- [x] Create waiter-specific endpoints
  - [x] GET /waiter/tables - View assigned tables
  - [x] GET /waiter/orders - View active orders
- [x] Build manual order placement
  - [x] POST /waiter/orders - Place order for table
- [x] Implement order serving workflow
  - [x] PATCH /orders/:id/serve - Mark as served
- [x] Add table assignment logic

---

## Phase 5: Payment & Billing System ✅ COMPLETE

### Cashier API
- [x] Create session bill calculation
  - [x] GET /sessions/:token/bill
  - [x] Calculate total with all orders
  - [x] Include tax and service charges
- [x] Build payment processing endpoints
  - [x] POST /payments - Record payment
  - [x] Support multiple payment methods
- [x] Implement invoice generation
  - [x] GET /sessions/:token/invoice
  - [x] Generate PDF invoice
- [x] Create transaction history
  - [x] GET /payments - List all payments
- [x] Add tip/gratuity support

### Payment Integration (Optional)
- [ ] Integrate Stripe/PayPal
- [ ] Implement card payment flow
- [ ] Add digital wallet support
- [ ] Build refund system

---

## Phase 6: Admin Panel Backend ✅ COMPLETE

### Inventory Management
- [x] Create inventory CRUD endpoints
- [x] Build inventory transaction system
- [x] Implement low-stock alerts
- [x] Create restocking workflow
- [x] Build inventory reports

### Promotions
- [x] Create promotion CRUD endpoints
- [x] Build promotion validation logic
- [x] Implement promotion application to orders
- [x] Add usage tracking

### Analytics & Reports
- [ ] Build sales analytics queries
- [ ] Create popular items report
- [ ] Implement time-based order analysis
- [ ] Build revenue tracking
- [ ] Create exportable reports (CSV, PDF)

### Restaurant Settings
- [ ] Create restaurant settings endpoints
- [ ] Implement business hours management
- [ ] Add tax and service charge configuration
- [ ] Build feature toggles

---

## Phase 7: Real-Time Features (WebSocket) 🔔

### WebSocket Infrastructure
- [ ] Set up WebSocket server
- [ ] Create WebSocket authentication
- [ ] Implement room-based broadcasting
  - [ ] Kitchen room (new orders)
  - [ ] Waiter room (order updates)
  - [ ] Customer room (order status)
- [ ] Handle connection/disconnection logic
- [ ] Implement reconnection strategy

### Real-Time Notifications
- [ ] Broadcast new orders to kitchen
- [ ] Send order status updates to customers
- [ ] Notify waiters of ready orders
- [ ] Add sound notifications

---

## Phase 8: Frontend Development 🎨

### 8.1: Frontend Foundation & Routing ✅ COMPLETE
- [x] **8.1.1**: Set up React Router with BrowserRouter in main.tsx
- [x] **8.1.2**: Create route structure with public and protected routes
- [x] **8.1.3**: Create Layout component with AppBar and Container
- [x] **8.1.4**: Build LoadingSpinner component (MUI CircularProgress)
- [x] **8.1.5**: Build ErrorBoundary component for error handling
- [x] **8.1.6**: Create NotFound 404 page component
- [x] **8.1.7**: Set up React Query QueryClientProvider with default options

### 8.2: Customer App - QR Scan & Session Flow ✅ COMPLETE
- [x] **8.2.1**: Create `/scan/:qrCode` route and QRScanPage component
- [x] **8.2.2**: Build API service function: `getTableByQRCode(qrCode)` in `services/api.ts`
- [x] **8.2.3**: Build API service function: `createSession(tableId, customerName, phone)` in `services/api.ts`
- [x] **8.2.4**: Create CustomerInfoForm component (name + phone input with validation)
- [x] **8.2.5**: Implement session creation flow (scan QR → show table info → collect customer info → create session)
- [x] **8.2.6**: Store session token in localStorage after session creation
- [x] **8.2.7**: Create SessionContext with React Context for managing active session state
- [x] **8.2.8**: Redirect to menu page after successful session creation

### 8.3: Customer App - Menu Browsing ✅ COMPLETE
- [x] **8.3.1**: Create `/menu` route and MenuPage component layout
- [x] **8.3.2**: Build API service functions: `getCategories()` and `getMenuItems(filters)` in `services/api.ts`
- [x] **8.3.3**: Create CategoryTabs component (MUI Tabs) for category filtering
- [x] **8.3.4**: Build MenuItemCard component (display item with image, name, price, description)
- [x] **8.3.5**: Add "Add to Cart" button to MenuItemCard with quantity selector
- [x] **8.3.6**: Implement search bar in MenuPage for searching menu items
- [x] **8.3.7**: Add dietary/allergen filter chips (vegetarian, vegan, gluten-free)
- [x] **8.3.8**: Show "Featured Items" section at top of menu
- [x] **8.3.9**: Handle loading states with skeleton loaders (MUI Skeleton)
- [x] **8.3.10**: Handle empty states (no items found)

### 8.4: Customer App - Menu Item Detail & Variants
- [ ] **8.4.1**: Create `/menu/:itemId` route and MenuItemDetailPage component
- [ ] **8.4.2**: Build API service function: `getMenuItemById(itemId)` in `services/api.ts`
- [ ] **8.4.3**: Create VariantSelector component for single_select variants (Radio buttons)
- [ ] **8.4.4**: Create VariantSelector component for multi_select variants (Checkboxes)
- [ ] **8.4.5**: Calculate and display dynamic price based on selected variants
- [ ] **8.4.6**: Add quantity selector (- / number / +)
- [ ] **8.4.7**: Add special instructions TextField (optional notes)
- [ ] **8.4.8**: Validate required variants before adding to cart
- [ ] **8.4.9**: Show allergen warnings and dietary info badges
- [ ] **8.4.10**: Add "Add to Cart" button with variant selections

### 8.5: Customer App - Cart Management (Zustand Store)
- [ ] **8.5.1**: Create Zustand store: `useCartStore` in `stores/cartStore.ts`
- [ ] **8.5.2**: Implement cart actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- [ ] **8.5.3**: Implement cart calculations: `subtotal`, `itemCount`, `totalWithVariants`
- [ ] **8.5.4**: Create CartDrawer component (MUI Drawer from right side)
- [ ] **8.5.5**: Build CartItem component showing item + variants + quantity controls
- [ ] **8.5.6**: Add FloatingCartButton (FAB) showing cart item count badge
- [ ] **8.5.7**: Implement cart persistence in localStorage (save/restore on load)
- [ ] **8.5.8**: Show empty cart state with "Browse Menu" CTA
- [ ] **8.5.9**: Add "Place Order" button in CartDrawer footer
- [ ] **8.5.10**: Show calculated totals (subtotal, tax, service charge, total)

### 8.6: Customer App - Order Placement
- [ ] **8.6.1**: Create `/checkout` route and CheckoutPage component
- [ ] **8.6.2**: Build API service function: `placeOrder(sessionToken, items, instructions)` in `services/api.ts`
- [ ] **8.6.3**: Create OrderSummary component showing all cart items and totals
- [ ] **8.6.4**: Add optional order-level special instructions field
- [ ] **8.6.5**: Implement order submission with loading state
- [ ] **8.6.6**: Show success dialog with order number after placement
- [ ] **8.6.7**: Clear cart after successful order placement
- [ ] **8.6.8**: Redirect to order tracking page after success
- [ ] **8.6.9**: Handle API errors (item unavailable, session expired, etc.)
- [ ] **8.6.10**: Add confirmation dialog before placing order

### 8.7: Customer App - Order Tracking
- [ ] **8.7.1**: Create `/orders` route and OrderTrackingPage component
- [ ] **8.7.2**: Build API service functions: `getSessionOrders(sessionToken)` and `getOrderById(orderId)` in `services/api.ts`
- [ ] **8.7.3**: Create OrderStatusCard component showing order with status badge
- [ ] **8.7.4**: Implement status timeline (pending → confirmed → preparing → ready → served)
- [ ] **8.7.5**: Show order items list for each order
- [ ] **8.7.6**: Add auto-refresh using React Query polling (refetchInterval: 10000)
- [ ] **8.7.7**: Show estimated preparation time for active orders
- [ ] **8.7.8**: Add "Order More" button to return to menu
- [ ] **8.7.9**: Show bill summary with all orders (subtotal + tax + service charge)
- [ ] **8.7.10**: Create "Request Bill" button to complete session

### 8.8: Authentication UI (Staff Login)
- [ ] **8.8.1**: Create `/login` route and LoginPage component
- [ ] **8.8.2**: Build API service functions: `login(email, password)`, `logout()`, `getCurrentUser()` in `services/api.ts`
- [ ] **8.8.3**: Create AuthContext with React Context (user state, login, logout methods)
- [ ] **8.8.4**: Create useAuth hook to access AuthContext
- [ ] **8.8.5**: Build LoginForm with email and password fields (react-hook-form validation)
- [ ] **8.8.6**: Store tokens (accessToken, refreshToken) in localStorage on login
- [ ] **8.8.7**: Create ProtectedRoute component (check auth before rendering)
- [ ] **8.8.8**: Redirect to appropriate dashboard based on user role after login
- [ ] **8.8.9**: Add logout functionality in AppBar user menu
- [ ] **8.8.10**: Handle token refresh automatically (already in api.ts interceptor)

### 8.9: Kitchen Dashboard
- [ ] **8.9.1**: Create `/kitchen` route and KitchenDashboard page
- [ ] **8.9.2**: Build API service functions: `getKitchenOrders(restaurantId, status)`, `updateKitchenOrderStatus(orderId, status)` in `services/api.ts`
- [ ] **8.9.3**: Create KitchenOrderCard component (show order details, table, items)
- [ ] **8.9.4**: Add status filter tabs (All, Pending, Preparing, Ready)
- [ ] **8.9.5**: Implement "Start Preparing" button (pending → preparing)
- [ ] **8.9.6**: Implement "Mark Ready" button (preparing → ready)
- [ ] **8.9.7**: Show order timer (time since order placed)
- [ ] **8.9.8**: Add sound notification for new orders (optional)
- [ ] **8.9.9**: Implement auto-refresh with React Query polling
- [ ] **8.9.10**: Group orders by table number

### 8.10: Waiter Dashboard
- [ ] **8.10.1**: Create `/waiter` route and WaiterDashboard page
- [ ] **8.10.2**: Build API service functions: `getWaiterTables(restaurantId)`, `getWaiterOrders(restaurantId)`, `serveOrder(orderId)` in `services/api.ts`
- [ ] **8.10.3**: Create TableGrid component showing all tables with status colors
- [ ] **8.10.4**: Create TableCard component (table number, capacity, status, customer name)
- [ ] **8.10.5**: Create OrdersList component for active orders
- [ ] **8.10.6**: Implement "Mark as Served" button for ready orders
- [ ] **8.10.7**: Show table session information (customer name, time seated)
- [ ] **8.10.8**: Add filter for table status (available, occupied, reserved)
- [ ] **8.10.9**: Implement click to view table details
- [ ] **8.10.10**: Add manual order placement option (future)

### 8.11: Cashier Dashboard
- [ ] **8.11.1**: Create `/cashier` route and CashierDashboard page
- [ ] **8.11.2**: Build API service functions: `getActiveSessions(restaurantId)`, `getSessionBill(sessionToken)`, `recordPayment(sessionToken, amount, method, tip)` in `services/api.ts`
- [ ] **8.11.3**: Create SessionCard component (table, customer, duration, unpaid bill)
- [ ] **8.11.4**: Create BillDialog component showing detailed bill breakdown
- [ ] **8.11.5**: Create PaymentForm component (amount, payment method selector, tip field)
- [ ] **8.11.6**: Implement payment recording flow
- [ ] **8.11.7**: Show payment success confirmation
- [ ] **8.11.8**: Auto-close session after payment recorded
- [ ] **8.11.9**: Add print/download receipt button (future)
- [ ] **8.11.10**: Show today's transaction summary

### 8.12: Admin Panel - Menu Management
- [ ] **8.12.1**: Create `/admin/menu` route and MenuManagementPage
- [ ] **8.12.2**: Build API service functions: `createMenuItem(data)`, `updateMenuItem(id, data)`, `deleteMenuItem(id)`, `toggleMenuItemAvailability(id)` in `services/api.ts`
- [ ] **8.12.3**: Create MenuItemsTable component with DataGrid (MUI)
- [ ] **8.12.4**: Create MenuItemDialog component for add/edit (form with validation)
- [ ] **8.12.5**: Implement quick toggle for availability (switch button)
- [ ] **8.12.6**: Add search and filter by category
- [ ] **8.12.7**: Show variant details in expanded row
- [ ] **8.12.8**: Implement delete confirmation dialog
- [ ] **8.12.9**: Add image upload field (placeholder for now)
- [ ] **8.12.10**: Handle form validation with react-hook-form

### 8.13: Admin Panel - Table Management
- [ ] **8.13.1**: Create `/admin/tables` route and TableManagementPage
- [ ] **8.13.2**: Build API service functions: `createTable(data)`, `updateTable(id, data)`, `deleteTable(id)`, `generateTableQR(id)` in `services/api.ts`
- [ ] **8.13.3**: Create TablesTable component with DataGrid
- [ ] **8.13.4**: Create TableDialog component for add/edit
- [ ] **8.13.5**: Add "Generate QR Code" button per table
- [ ] **8.13.6**: Show QR code in dialog with download option (qrcode.react)
- [ ] **8.13.7**: Add status badge with color coding
- [ ] **8.13.8**: Implement delete confirmation dialog
- [ ] **8.13.9**: Show current session info if table occupied
- [ ] **8.13.10**: Add bulk QR code generation (all tables)

### 8.14: Admin Panel - User Management
- [ ] **8.14.1**: Create `/admin/users` route and UserManagementPage
- [ ] **8.14.2**: Build API service functions: `getUsers(filters)`, `createUser(data)`, `updateUser(id, data)`, `deleteUser(id)` in `services/api.ts`
- [ ] **8.14.3**: Create UsersTable component with DataGrid
- [ ] **8.14.4**: Create UserDialog component for add/edit
- [ ] **8.14.5**: Add role selector dropdown (filter super_admin for non-super-admins)
- [ ] **8.14.6**: Show is_active status with toggle switch
- [ ] **8.14.7**: Add search by name/email
- [ ] **8.14.8**: Add filter by role
- [ ] **8.14.9**: Implement delete confirmation dialog
- [ ] **8.14.10**: Handle password field (required on create, optional on update)

### 8.15: Shared UI Components & Polish
- [ ] **8.15.1**: Create ConfirmDialog reusable component
- [ ] **8.15.2**: Create SuccessSnackbar for showing success messages
- [ ] **8.15.3**: Create ErrorSnackbar for showing error messages
- [ ] **8.15.4**: Create EmptyState component (icon + message + CTA)
- [ ] **8.15.5**: Create PageHeader component (title + actions)
- [ ] **8.15.6**: Add responsive design breakpoints for mobile/tablet
- [ ] **8.15.7**: Create theme configuration (MUI theme with restaurant colors)
- [ ] **8.15.8**: Add loading skeletons for all list views
- [ ] **8.15.9**: Implement proper error handling in all API calls
- [ ] **8.15.10**: Add accessibility attributes (aria-labels, roles)

---

## Phase 9: PWA & Offline Features 📱

### PWA Configuration
- [ ] Create web app manifest
- [ ] Design app icons (multiple sizes)
- [ ] Configure splash screens
- [ ] Implement install prompt

### Service Worker
- [ ] Implement service worker registration
- [ ] Create caching strategies
- [ ] Build offline fallback pages
- [ ] Implement background sync
- [ ] Add push notification support

---

## Phase 10: Multi-Restaurant Support 🏢

### Super Admin Features
- [ ] Create restaurant CRUD endpoints
- [ ] Build restaurant onboarding flow
- [ ] Implement cross-restaurant analytics
- [ ] Create restaurant selection UI
- [ ] Build multi-restaurant dashboard

---

## Phase 11: Testing & QA ✅

### Backend Testing
- [ ] Write unit tests for controllers
- [ ] Create API endpoint tests
- [ ] Implement integration tests
- [ ] Add authentication tests
- [ ] Test WebSocket functionality

### Frontend Testing
- [ ] Write component unit tests
- [ ] Create integration tests
- [ ] Implement E2E tests
- [ ] Test responsive design
- [ ] Test offline capabilities

### Performance & Security
- [ ] Load testing for API
- [ ] WebSocket stress testing
- [ ] Database query optimization
- [ ] Security penetration testing
- [ ] SQL injection testing

---

## Phase 12: Deployment & Launch 🚀

### CI/CD Pipeline
- [ ] Set up GitHub Actions
- [ ] Create automated testing pipeline
- [ ] Implement automated deployment
- [ ] Set up staging environment

### Production Deployment
- [ ] Configure production server
- [ ] Set up SSL certificates
- [ ] Deploy database with backups
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and logging

### Polish & Launch
- [ ] Conduct user testing
- [ ] Refine UI/UX
- [ ] Add comprehensive error messages
- [ ] Implement rate limiting
- [ ] Create user documentation
- [ ] Final security audit
- [ ] Launch checklist

---

## Progress Summary

```
✅ Phase 1: Backend Foundation - COMPLETE (100%)
✅ Phase 2: Menu & Table Management - COMPLETE (100%)
✅ Phase 2.5: Security Hardening - COMPLETE (100%)
✅ Phase 3: Order Session & Cart - COMPLETE (100%)
✅ Phase 4: Kitchen & Waiter - COMPLETE (100%)
✅ Phase 5: Payment & Billing - COMPLETE (100%)
✅ Phase 6: Admin Panel - COMPLETE (85% - Analytics optional)
🔔 Phase 7: Real-Time Features - NEXT (0%)
🎨 Phase 8: Frontend Development - Planned (5%)
📱 Phase 9: PWA Features - Planned (0%)
🏢 Phase 10: Multi-Restaurant - Planned (0%)
✅ Phase 11: Testing & QA - Planned (0%)
🚀 Phase 12: Deployment - Planned (0%)
```

**Overall Progress: ~50%** (Backend API fully functional!)

---

## 📋 Implementation Notes

### Phase 8 - Frontend Development Approach

**Build Order:**
1. **Foundation First** (8.1): Set up routing, layouts, error handling
2. **Customer Flow** (8.2-8.7): Most important - allows customers to order
3. **Staff Authentication** (8.8): Required for all staff interfaces
4. **Staff Interfaces** (8.9-8.11): Kitchen, Waiter, Cashier dashboards
5. **Admin Panel** (8.12-8.14): Menu, Table, User management
6. **Polish** (8.15): Shared components, responsive design, accessibility

**Technology Stack:**
- React 19 + TypeScript
- Material-UI (MUI) for components
- React Router DOM for routing
- Zustand for cart state management
- React Query for server state & caching
- React Hook Form for form validation
- Axios for API calls (already configured)

**Key Files:**
- `frontend/src/services/api.ts` - API service functions
- `frontend/src/types/index.ts` - TypeScript interfaces
- `frontend/src/stores/cartStore.ts` - Cart state (Zustand)
- `frontend/src/contexts/AuthContext.tsx` - Auth state
- `frontend/src/contexts/SessionContext.tsx` - Customer session state

**API Integration:**
- All API endpoints are already built and documented in `API_ENDPOINTS.md`
- Base URL: `http://localhost:5000/api/v1`
- Auth interceptor already configured in `api.ts`

---

## 🚀 Ready to Implement!

The spec is complete! You can now begin implementing the frontend tasks by following the detailed tasks in Phase 8 above.

**Recommended approach:**
- Implement tasks in order (8.1 → 8.2 → 8.3, etc.)
- Each sub-phase builds on the previous one
- Test each feature as you complete it
- Use the running backend API for integration testing

**To start development:**
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173` and connect to the backend at `http://localhost:5000`.

---
