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
