# 📡 API Endpoints Reference

Base URL: `http://localhost:5000/api/v1`

---

## 🏥 Health Check

### Check Server Status
- **GET** `/health`
- **Auth:** None
- **Response:**
```json
{
    "success": true,
    "message": "Server is running",
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔐 Authentication Endpoints

### 1. Login
- **POST** `/auth/login`
- **Auth:** None
- **Body:**
```json
{
    "email": "admin@restaurant.com",
    "password": "admin123"
}
```
- **Response:**
```json
{
    "success": true,
    "data": {
        "user": { ... },
        "accessToken": "jwt-token",
        "refreshToken": "jwt-refresh-token"
    }
}
```

---

### 2. Get Current User
- **GET** `/auth/me`
- **Auth:** Bearer Token Required
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "email": "admin@restaurant.com",
        "role": "super_admin",
        "name": "Super Admin"
    }
}
```

---

### 3. Refresh Token
- **POST** `/auth/refresh`
- **Auth:** None
- **Body:**
```json
{
    "refreshToken": "your-refresh-token"
}
```
- **Response:**
```json
{
    "success": true,
    "data": {
        "accessToken": "new-jwt-token"
    }
}
```

---

### 4. Logout
- **POST** `/auth/logout`
- **Auth:** Bearer Token Required
- **Response:**
```json
{
    "success": true,
    "message": "Logout successful"
}
```

---

## 👥 User Management Endpoints

### 1. Get All Users
- **GET** `/users`
- **Auth:** Bearer Token (Admin Only)
- **Query Parameters:**
  - `page` (optional, default: 1)
  - `pageSize` (optional, default: 10)
  - `role` (optional, filter by role)
  - `search` (optional, search by name/email)
- **Example:** `/users?page=1&pageSize=10&role=waiter`
- **Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "email": "user@demo.com",
            "role": "waiter",
            "name": "User Name",
            "is_active": true
        }
    ],
    "pagination": {
        "page": 1,
        "pageSize": 10,
        "totalItems": 50,
        "totalPages": 5
    }
}
```

---

### 2. Get User by ID
- **GET** `/users/:id`
- **Auth:** Bearer Token (Admin Only)
- **Example:** `/users/123e4567-e89b-12d3-a456-426614174000`
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "email": "user@demo.com",
        "role": "waiter",
        "name": "User Name",
        "phone": "+1234567890",
        "is_active": true,
        "created_at": "2024-01-15T10:00:00.000Z",
        "updated_at": "2024-01-15T10:00:00.000Z"
    }
}
```

---

### 3. Create User
- **POST** `/users`
- **Auth:** Bearer Token (Admin Only)
- **Body:**
```json
{
    "email": "newuser@demo.com",
    "password": "password123",
    "role": "waiter",
    "restaurant_id": "restaurant-uuid",
    "name": "New User",
    "phone": "+1234567890"
}
```
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "new-user-uuid",
        "email": "newuser@demo.com",
        "role": "waiter",
        "name": "New User",
        "is_active": true
    },
    "message": "User created successfully"
}
```

---

### 4. Update User
- **PUT** `/users/:id`
- **Auth:** Bearer Token (Admin Only)
- **Body:**
```json
{
    "name": "Updated Name",
    "phone": "+9876543210",
    "is_active": true
}
```
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "user-uuid",
        "name": "Updated Name",
        "phone": "+9876543210",
        "updated_at": "2024-01-15T12:00:00.000Z"
    },
    "message": "User updated successfully"
}
```

---

### 5. Delete User
- **DELETE** `/users/:id`
- **Auth:** Bearer Token (Admin Only)
- **Response:**
```json
{
    "success": true,
    "message": "User deleted successfully"
}
```

---

## 🔒 Authorization Matrix

| Endpoint | Super Admin | Restaurant Admin | Kitchen | Waiter | Cashier |
|----------|-------------|------------------|---------|--------|---------|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/refresh | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/logout | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /users | ✅ | ✅ | ❌ | ❌ | ❌ |
| GET /users/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| POST /users | ✅ | ✅ | ❌ | ❌ | ❌ |
| PUT /users/:id | ✅ | ✅ | ❌ | ❌ | ❌ |
| DELETE /users/:id | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📋 User Roles

| Role | Value | Description |
|------|-------|-------------|
| Super Admin | `super_admin` | Full system access, manage all restaurants |
| Restaurant Admin | `restaurant_admin` | Manage single restaurant |
| Kitchen | `kitchen` | View and manage orders in kitchen |
| Waiter | `waiter` | Take and manage customer orders |
| Cashier | `cashier` | Process payments |

---

## 🔑 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

The Postman collection handles this automatically!

---

## ⚠️ Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## 📚 Response Format

All API responses follow this format:

### Success Response:
```json
{
    "success": true,
    "data": { ... },
    "message": "Optional success message"
}
```

### Error Response:
```json
{
    "success": false,
    "error": "Error message",
    "errors": [ ... ]  // Optional validation errors
}
```

---

## 🧪 Testing in Postman

1. Import `Restaurant-API.postman_collection.json`
2. Login to get token (automatically saved)
3. Test protected routes
4. See full guide: `POSTMAN_TESTING.md`

---

**Happy Testing!** 🚀


---

## 🍔 Menu Endpoints

### 1. Get All Categories
- **GET** `/menu/categories`
- **Auth:** None (Public)
- **Query Parameters:**
  - `restaurantId` (optional) - Filter by restaurant
- **Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "Appetizers",
            "description": "Start your meal with our delicious appetizers",
            "image_url": null,
            "display_order": 1,
            "is_active": true
        }
    ]
}
```

---

### 2. Get All Menu Items
- **GET** `/menu/items`
- **Auth:** None (Public)
- **Query Parameters:**
  - `categoryId` (optional) - Filter by category
  - `search` (optional) - Search in name and description
  - `isAvailable` (optional) - Filter available items (true/false)
  - `isFeatured` (optional) - Filter featured items (true/false)
  - `restaurantId` (optional) - Filter by restaurant
  - `page` (optional, default: 1)
  - `pageSize` (optional, default: 20)
- **Example:** `/menu/items?categoryId=uuid&search=burger&isAvailable=true&page=1&pageSize=10`
- **Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "Classic Burger",
            "description": "Juicy beef patty with lettuce...",
            "image_url": null,
            "base_price": "14.99",
            "preparation_time": 20,
            "is_available": true,
            "is_featured": true,
            "dietary_info": {},
            "allergens": ["gluten", "dairy"],
            "category_id": "uuid",
            "category_name": "Main Course"
        }
    ],
    "pagination": {
        "page": 1,
        "pageSize": 10,
        "totalItems": 50,
        "totalPages": 5
    }
}
```

---

### 3. Get Menu Item by ID
- **GET** `/menu/items/:id`
- **Auth:** None (Public)
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "name": "Classic Burger",
        "description": "Juicy beef patty...",
        "base_price": "14.99",
        "variants": [
            {
                "id": "uuid",
                "name": "Size",
                "type": "single_select",
                "is_required": true,
                "options": [
                    {
                        "id": "uuid",
                        "name": "Regular",
                        "price_modifier": "0.00",
                        "is_default": true
                    },
                    {
                        "id": "uuid",
                        "name": "Large",
                        "price_modifier": "3.00",
                        "is_default": false
                    }
                ]
            }
        ]
    }
}
```

---

### 4. Create Menu Item
- **POST** `/menu/items`
- **Auth:** Bearer Token (Admin Only)
- **Body:**
```json
{
    "name": "New Burger",
    "description": "Delicious new burger",
    "base_price": 15.99,
    "category_id": "uuid",
    "restaurant_id": "uuid",
    "preparation_time": 20,
    "is_featured": false,
    "dietary_info": {"vegetarian": false},
    "allergens": ["gluten", "dairy"]
}
```
- **Response:**
```json
{
    "success": true,
    "data": { ... },
    "message": "Menu item created successfully"
}
```

---

### 5. Update Menu Item
- **PUT** `/menu/items/:id`
- **Auth:** Bearer Token (Admin Only)
- **Body:**
```json
{
    "name": "Updated Burger",
    "base_price": 16.99,
    "is_available": true
}
```
- **Response:**
```json
{
    "success": true,
    "data": { ... },
    "message": "Menu item updated successfully"
}
```

---

### 6. Delete Menu Item
- **DELETE** `/menu/items/:id`
- **Auth:** Bearer Token (Admin Only)
- **Response:**
```json
{
    "success": true,
    "message": "Menu item deleted successfully"
}
```

---

### 7. Toggle Menu Item Availability
- **PATCH** `/menu/items/:id/toggle`
- **Auth:** Bearer Token (Admin Only)
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "name": "Classic Burger",
        "is_available": false
    },
    "message": "Menu item disabled successfully"
}
```

---

## 🔒 Updated Authorization Matrix

| Endpoint | Super Admin | Restaurant Admin | Kitchen | Waiter | Cashier | Public |
|----------|-------------|------------------|---------|--------|---------|--------|
| GET /menu/categories | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /menu/items | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /menu/items/:id | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /menu/items | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT /menu/items/:id | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE /menu/items/:id | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH /menu/items/:id/toggle | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

**Happy Testing!** 🚀


---

## 🪑 Table Management Endpoints

### 1. Get All Tables
- **GET** `/tables`
- **Auth:** Bearer Token (Admin/Waiter)
- **Query Parameters:**
  - `restaurantId` (optional) - Filter by restaurant
  - `status` (optional) - Filter by status (available/occupied/reserved/maintenance)
- **Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "restaurant_id": "uuid",
            "table_number": "T01",
            "qr_code": "uuid",
            "capacity": 4,
            "location": "Ground Floor - Window",
            "status": "available",
            "current_session_id": null,
            "created_at": "2024-01-15T10:00:00.000Z"
        }
    ]
}
```

---

### 2. Get Table by ID
- **GET** `/tables/:id`
- **Auth:** Bearer Token (Admin/Waiter)
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "table_number": "T01",
        "capacity": 4,
        "status": "occupied",
        "current_session_id": "uuid",
        "session_token": "session-token",
        "customer_name": "John Doe",
        "started_at": "2024-01-15T12:00:00.000Z"
    }
}
```

---

### 3. Create Table
- **POST** `/tables`
- **Auth:** Bearer Token (Admin Only)
- **Body:**
```json
{
    "restaurant_id": "uuid",
    "table_number": "T01",
    "capacity": 4,
    "location": "Ground Floor - Window"
}
```
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "table_number": "T01",
        "qr_code": "generated-uuid",
        "capacity": 4,
        "status": "available"
    },
    "message": "Table created successfully"
}
```

---

### 4. Update Table
- **PUT** `/tables/:id`
- **Auth:** Bearer Token (Admin Only)
- **Body:**
```json
{
    "table_number": "T01-A",
    "capacity": 6,
    "location": "Updated Location",
    "status": "available"
}
```
- **Response:**
```json
{
    "success": true,
    "data": { ... },
    "message": "Table updated successfully"
}
```

---

### 5. Delete Table
- **DELETE** `/tables/:id`
- **Auth:** Bearer Token (Admin Only)
- **Response:**
```json
{
    "success": true,
    "message": "Table deleted successfully"
}
```

---

### 6. Update Table Status
- **PATCH** `/tables/:id/status`
- **Auth:** Bearer Token (Admin/Waiter)
- **Body:**
```json
{
    "status": "occupied"
}
```
- **Valid Status Values:** `available`, `occupied`, `reserved`, `maintenance`
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "table_number": "T01",
        "status": "occupied"
    },
    "message": "Table status updated successfully"
}
```

---

### 7. Generate QR Code
- **GET** `/tables/:id/qr`
- **Auth:** Bearer Token (Admin Only)
- **Response:**
```json
{
    "success": true,
    "data": {
        "table_id": "uuid",
        "table_number": "T01",
        "qr_code": "uuid",
        "qr_code_url": "http://localhost:5173/scan/uuid",
        "qr_code_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
    }
}
```

---

### 8. Get Table by QR Code (Public)
- **GET** `/tables/scan/:qrCode`
- **Auth:** None (Public)
- **Example:** `/tables/scan/abc-123-def-456`
- **Response:**
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "restaurant_id": "uuid",
        "table_number": "T01",
        "capacity": 4,
        "location": "Ground Floor - Window",
        "status": "available",
        "restaurant_name": "Demo Restaurant",
        "restaurant_logo": "https://...",
        "tax_rate": "10.00",
        "service_charge_rate": "5.00"
    }
}
```

---

## 🔒 Updated Authorization Matrix

| Endpoint | Super Admin | Restaurant Admin | Kitchen | Waiter | Cashier | Public |
|----------|-------------|------------------|---------|--------|---------|--------|
| GET /tables | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| GET /tables/:id | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| POST /tables | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PUT /tables/:id | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| DELETE /tables/:id | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH /tables/:id/status | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| GET /tables/:id/qr | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /tables/scan/:qrCode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

**Happy Testing!** 🚀


---

## Session Management (3 endpoints)

### POST /api/v1/sessions
Create a new dining session when customer scans QR code.

**Authentication:** Not Required (Public)

**Request Body:**
```json
{
  "table_id": "uuid",
  "customer_name": "John Doe",
  "customer_phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session_id": "uuid",
    "session_token": "unique-session-token",
    "table_id": "uuid",
    "restaurant_id": "uuid",
    "customer_name": "John Doe",
    "status": "active",
    "started_at": "timestamp"
  },
  "message": "Session created successfully"
}
```

---

### GET /api/v1/sessions/:token
Get active session details with orders.

**Authentication:** Not Required (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurant_id": "uuid",
    "table_id": "uuid",
    "session_token": "token",
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "status": "active",
    "started_at": "timestamp",
    "completed_at": null,
    "table_number": "T-01",
    "capacity": 4,
    "location": "Main Floor",
    "restaurant_name": "The Gourmet Kitchen",
    "restaurant_logo": "https://...",
    "tax_rate": 10.0,
    "service_charge_rate": 5.0,
    "currency": "USD",
    "orders": [
      {
        "id": "uuid",
        "order_number": 1,
        "status": "pending",
        "subtotal": 25.00,
        "tax_amount": 2.50,
        "service_charge": 1.25,
        "discount_amount": 0.00,
        "total_amount": 28.75,
        "created_at": "timestamp"
      }
    ]
  }
}
```

---

### PATCH /api/v1/sessions/:token/complete
Complete the dining session and release the table.

**Authentication:** Not Required (Public)

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Session completed successfully"
}
```

---

## Order Management (4 endpoints)

### POST /api/v1/orders
Submit a customer order.

**Authentication:** Not Required (Public)

**Request Body:**
```json
{
  "session_token": "unique-session-token",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "selected_variants": {
        "Size": "Large",
        "Spice Level": "Medium"
      },
      "special_instructions": "No onions"
    }
  ],
  "special_instructions": "Please serve quickly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "order_number": 1,
    "status": "pending",
    "subtotal": 25.00,
    "tax_amount": 2.50,
    "service_charge": 1.25,
    "total_amount": 28.75,
    "created_at": "timestamp"
  },
  "message": "Order placed successfully"
}
```

---

### GET /api/v1/orders/:id
Get order details with items.

**Authentication:** Not Required (Public)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": 1,
    "status": "preparing",
    "order_type": "dine_in",
    "subtotal": 25.00,
    "tax_amount": 2.50,
    "service_charge": 1.25,
    "discount_amount": 0.00,
    "total_amount": 28.75,
    "special_instructions": "Please serve quickly",
    "created_at": "timestamp",
    "confirmed_at": "timestamp",
    "completed_at": null,
    "session_token": "token",
    "customer_name": "John Doe",
    "items": [
      {
        "id": "uuid",
        "quantity": 2,
        "unit_price": 12.50,
        "selected_variants": {"Size": "Large"},
        "special_instructions": "No onions",
        "status": "preparing",
        "total_price": 25.00,
        "item_name": "Margherita Pizza",
        "image_url": "https://...",
        "description": "Classic pizza"
      }
    ]
  }
}
```

---

### GET /api/v1/sessions/:token/orders
Get all orders for a session.

**Authentication:** Not Required (Public)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": 1,
      "status": "served",
      "order_type": "dine_in",
      "subtotal": 25.00,
      "tax_amount": 2.50,
      "service_charge": 1.25,
      "discount_amount": 0.00,
      "total_amount": 28.75,
      "special_instructions": null,
      "created_at": "timestamp",
      "confirmed_at": "timestamp",
      "completed_at": "timestamp",
      "items": [
        {
          "id": "uuid",
          "quantity": 2,
          "unit_price": 12.50,
          "selected_variants": null,
          "special_instructions": null,
          "status": "served",
          "total_price": 25.00,
          "item_name": "Margherita Pizza",
          "image_url": "https://..."
        }
      ]
    }
  ]
}
```

---

### PATCH /api/v1/orders/:id/status
Update order status.

**Authentication:** Not Required (Public - but should be restricted in production)

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Valid Statuses:** `pending`, `confirmed`, `preparing`, `ready`, `served`, `cancelled`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": 1,
    "status": "confirmed",
    "confirmed_at": "timestamp",
    "completed_at": null
  },
  "message": "Order status updated successfully"
}
```


---

## Kitchen Management (3 endpoints)

### GET /api/v1/kitchen/orders
Get kitchen orders filtered by status.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, kitchen_staff

**Query Parameters:**
- `restaurantId` (required for super_admin): Filter by restaurant
- `status` (optional): Filter by status (pending, preparing, ready)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": 1,
      "status": "pending",
      "order_type": "dine_in",
      "subtotal": 25.00,
      "tax_amount": 2.50,
      "service_charge": 1.25,
      "total_amount": 28.75,
      "special_instructions": "No onions",
      "created_at": "timestamp",
      "confirmed_at": null,
      "session_token": "token",
      "customer_name": "John Doe",
      "table_number": "T-01",
      "location": "Main Floor",
      "items": [
        {
          "id": "uuid",
          "quantity": 2,
          "unit_price": 12.50,
          "selected_variants": {"Size": "Large"},
          "special_instructions": "Extra cheese",
          "status": "pending",
          "total_price": 25.00,
          "item_name": "Margherita Pizza",
          "image_url": "https://...",
          "preparation_time": 15
        }
      ],
      "estimated_prep_time": 30
    }
  ]
}
```

---

### PATCH /api/v1/kitchen/orders/:id/status
Update kitchen order status.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, kitchen_staff

**Request Body:**
```json
{
  "status": "preparing"
}
```

**Valid Statuses (Kitchen):** `preparing`, `ready`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": 1,
    "status": "preparing",
    "confirmed_at": "timestamp"
  },
  "message": "Order status updated successfully"
}
```

---

### PATCH /api/v1/kitchen/order-items/:id/status
Update individual order item status.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, kitchen_staff

**Request Body:**
```json
{
  "status": "ready"
}
```

**Valid Statuses:** `pending`, `preparing`, `ready`, `served`, `cancelled`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ready"
  },
  "message": "Order item status updated successfully"
}
```

---

## Waiter Management (4 endpoints)

### GET /api/v1/waiter/tables
Get all tables for waiter's restaurant.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, waiter

**Query Parameters:**
- `restaurantId` (required for super_admin): Filter by restaurant

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "table_number": "T-01",
      "capacity": 4,
      "location": "Main Floor",
      "status": "occupied",
      "current_session_id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "session_token": "token",
      "customer_name": "John Doe",
      "started_at": "timestamp"
    }
  ]
}
```

---

### GET /api/v1/waiter/orders
Get active orders for waiter's restaurant.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, waiter

**Query Parameters:**
- `restaurantId` (required for super_admin): Filter by restaurant
- `status` (optional): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": 1,
      "status": "ready",
      "order_type": "dine_in",
      "subtotal": 25.00,
      "tax_amount": 2.50,
      "service_charge": 1.25,
      "total_amount": 28.75,
      "special_instructions": null,
      "created_at": "timestamp",
      "confirmed_at": "timestamp",
      "session_token": "token",
      "customer_name": "John Doe",
      "table_number": "T-01",
      "location": "Main Floor",
      "items": [
        {
          "id": "uuid",
          "quantity": 2,
          "unit_price": 12.50,
          "selected_variants": null,
          "special_instructions": null,
          "status": "ready",
          "total_price": 25.00,
          "item_name": "Margherita Pizza",
          "image_url": "https://..."
        }
      ]
    }
  ]
}
```

---

### POST /api/v1/waiter/orders
Place order on behalf of customer (waiter-assisted ordering).

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, waiter

**Request Body:**
```json
{
  "session_token": "unique-session-token",
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "selected_variants": {
        "Size": "Large",
        "Spice Level": "Medium"
      },
      "special_instructions": "No onions"
    }
  ],
  "special_instructions": "Please serve quickly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "uuid",
    "order_number": 1,
    "status": "pending",
    "subtotal": 25.00,
    "tax_amount": 2.50,
    "service_charge": 1.25,
    "total_amount": 28.75,
    "created_at": "timestamp"
  },
  "message": "Order placed successfully by waiter"
}
```

---

### PATCH /api/v1/waiter/orders/:id/serve
Mark order as served.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, waiter

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "order_number": 1,
    "status": "served",
    "completed_at": "timestamp"
  },
  "message": "Order marked as served"
}
```

---

## API Summary

**Total Endpoints: 30**

- Authentication: 4 endpoints
- User Management: 6 endpoints
- Menu Management: 7 endpoints
- Table Management: 8 endpoints
- Session Management: 3 endpoints
- Order Management: 4 endpoints
- Kitchen Management: 3 endpoints
- Waiter Management: 4 endpoints


---

## Cashier/Payment Management (6 endpoints)

### GET /api/v1/cashier/sessions/active
Get all active sessions (unpaid bills).

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, cashier

**Query Parameters:**
- `restaurantId` (required for super_admin): Filter by restaurant

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "session_token": "token",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "status": "active",
      "started_at": "timestamp",
      "table_number": "T-01",
      "location": "Main Floor"
    }
  ]
}
```

---

### GET /api/v1/cashier/sessions/:token/bill
Get complete bill for a session.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, cashier

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "session_token": "token",
      "customer_name": "John Doe",
      "customer_phone": "+1234567890",
      "table_number": "T-01",
      "location": "Main Floor",
      "restaurant_name": "The Gourmet Kitchen",
      "started_at": "timestamp",
      "currency": "USD"
    },
    "orders": [
      {
        "id": "uuid",
        "order_number": 1,
        "status": "served",
        "subtotal": 25.00,
        "tax_amount": 2.50,
        "service_charge": 1.25,
        "discount_amount": 0.00,
        "total_amount": 28.75,
        "created_at": "timestamp",
        "items": [
          {
            "id": "uuid",
            "quantity": 2,
            "unit_price": 12.50,
            "selected_variants": null,
            "total_price": 25.00,
            "item_name": "Margherita Pizza"
          }
        ]
      }
    ],
    "bill": {
      "subtotal": "25.00",
      "tax_amount": "2.50",
      "service_charge": "1.25",
      "discount_amount": "0.00",
      "total_amount": "28.75",
      "tax_rate": 10.0,
      "service_charge_rate": 5.0
    }
  }
}
```

---

### GET /api/v1/cashier/sessions/:token/orders
Get all orders for a session.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, cashier

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_number": 1,
      "status": "served",
      "order_type": "dine_in",
      "subtotal": 25.00,
      "tax_amount": 2.50,
      "service_charge": 1.25,
      "discount_amount": 0.00,
      "total_amount": 28.75,
      "special_instructions": null,
      "created_at": "timestamp",
      "items": [
        {
          "id": "uuid",
          "quantity": 2,
          "unit_price": 12.50,
          "selected_variants": null,
          "special_instructions": null,
          "status": "served",
          "total_price": 25.00,
          "item_name": "Margherita Pizza"
        }
      ]
    }
  ]
}
```

---

### POST /api/v1/cashier/payments
Record a payment for a session.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, cashier

**Request Body:**
```json
{
  "session_token": "unique-session-token",
  "amount": 28.75,
  "payment_method": "cash",
  "tip_amount": 5.00
}
```

**Valid Payment Methods:** `cash`, `card`, `digital_wallet`, `online`

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "amount": 33.75,
    "payment_method": "cash",
    "status": "completed",
    "tip_amount": "5.00",
    "bill_total": "28.75",
    "created_at": "timestamp"
  },
  "message": "Payment recorded successfully"
}
```

---

### GET /api/v1/cashier/payments/:id
Get payment details.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, cashier

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "restaurant_id": "uuid",
    "session_id": "uuid",
    "amount": 33.75,
    "payment_method": "cash",
    "status": "completed",
    "transaction_id": null,
    "created_at": "timestamp",
    "completed_at": "timestamp",
    "session_token": "token",
    "customer_name": "John Doe"
  }
}
```

---

### GET /api/v1/cashier/transactions/today
Get today's transactions summary.

**Authentication:** Required  
**Roles:** super_admin, restaurant_admin, cashier

**Query Parameters:**
- `restaurantId` (required for super_admin): Filter by restaurant

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "amount": 33.75,
        "payment_method": "cash",
        "status": "completed",
        "created_at": "timestamp",
        "completed_at": "timestamp",
        "session_token": "token",
        "customer_name": "John Doe",
        "table_number": "T-01"
      }
    ],
    "summary": {
      "total_amount": "250.50",
      "transaction_count": 8,
      "by_payment_method": {
        "cash": 120.25,
        "card": 100.00,
        "digital_wallet": 30.25
      }
    }
  }
}
```

---

## API Summary

**Total Endpoints: 36**

- Authentication: 4 endpoints
- User Management: 6 endpoints
- Menu Management: 7 endpoints
- Table Management: 8 endpoints
- Session Management: 3 endpoints
- Order Management: 4 endpoints
- Kitchen Management: 3 endpoints
- Waiter Management: 4 endpoints
- Cashier/Payment Management: 6 endpoints
