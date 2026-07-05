# API Testing Guide

## Setup & Run

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
```bash
# Copy .env.example to .env
copy .env.example .env

# Edit .env and update database credentials
```

### 3. Create Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE restaurant_db;
```

### 4. Run Schema Migration
```bash
# Option 1: Using psql
psql -U postgres -d restaurant_db -f src/database/schema.sql

# Option 2: Copy and paste schema.sql content in pgAdmin Query Tool
```

### 5. Seed Database (Create Test Users)
```bash
npm run seed
```

**Output:**
```
✓ Created restaurant
✓ Created super admin: admin@restaurant.com (password: admin123)
✓ Created restaurant admin: restaurant@demo.com (password: admin123)
✓ Created kitchen staff: kitchen@demo.com (password: kitchen123)
✓ Created waiter: waiter@demo.com (password: waiter123)
✓ Created cashier: cashier@demo.com (password: cashier123)
```

### 6. Start Server
```bash
npm run dev
```

**Output:**
```
✓ Database connected successfully
✓ Redis connected successfully
✓ Server running on port 5000
```

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Health Check

**GET** `/health`

```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### 1. Login

**POST** `/api/v1/auth/login`

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@restaurant.com\",
    \"password\": \"admin123\"
  }"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@restaurant.com",
      "role": "super_admin",
      "name": "Super Admin",
      "is_active": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "Login successful"
}
```

**Test All Users:**
- Super Admin: `admin@restaurant.com` / `admin123`
- Restaurant Admin: `restaurant@demo.com` / `admin123`
- Kitchen Staff: `kitchen@demo.com` / `kitchen123`
- Waiter: `waiter@demo.com` / `waiter123`
- Cashier: `cashier@demo.com` / `cashier123`

---

### 2. Get Current User

**GET** `/api/v1/auth/me`

**Headers:** `Authorization: Bearer <accessToken>`

```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@restaurant.com",
    "role": "super_admin",
    "name": "Super Admin",
    "phone": null,
    "avatar_url": null,
    "is_active": true
  }
}
```

---

### 3. Refresh Token

**POST** `/api/v1/auth/refresh`

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"YOUR_REFRESH_TOKEN\"
  }"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token..."
  },
  "message": "Token refreshed successfully"
}
```

---

### 4. Logout

**POST** `/api/v1/auth/logout`

**Headers:** `Authorization: Bearer <accessToken>`

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

---

## User Management Endpoints

**Note:** All user endpoints require authentication. Most require admin role.

### 1. Get All Users

**GET** `/api/v1/users`

**Headers:** `Authorization: Bearer <accessToken>`

**Query Params:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

```bash
curl http://localhost:5000/api/v1/users?page=1&pageSize=10 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "admin@restaurant.com",
      "role": "super_admin",
      "name": "Super Admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 5,
    "totalPages": 1
  }
}
```

---

### 2. Get User By ID

**GET** `/api/v1/users/:userId`

```bash
curl http://localhost:5000/api/v1/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 3. Create User

**POST** `/api/v1/users`

**Headers:** `Authorization: Bearer <accessToken>`

```bash
curl -X POST http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"newuser@demo.com\",
    \"password\": \"password123\",
    \"role\": \"waiter\",
    \"restaurant_id\": \"RESTAURANT_UUID\",
    \"name\": \"New Waiter\",
    \"phone\": \"+1234567890\"
  }"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_uuid",
    "email": "newuser@demo.com",
    "role": "waiter",
    "name": "New Waiter",
    "phone": "+1234567890",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "User created successfully"
}
```

---

### 4. Update User

**PUT** `/api/v1/users/:userId`

```bash
curl -X PUT http://localhost:5000/api/v1/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Updated Name\",
    \"phone\": \"+9876543210\",
    \"is_active\": true
  }"
```

---

### 5. Update Password

**PATCH** `/api/v1/users/:userId/password`

```bash
curl -X PATCH http://localhost:5000/api/v1/users/USER_UUID/password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"currentPassword\": \"oldpassword123\",
    \"newPassword\": \"newpassword123\"
  }"
```

---

### 6. Delete User

**DELETE** `/api/v1/users/:userId`

```bash
curl -X DELETE http://localhost:5000/api/v1/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Testing with Postman

### Import Collection

Create a new Postman collection with these settings:

**Authorization Tab:**
- Type: Bearer Token
- Token: `{{accessToken}}`

**Variables:**
- `baseUrl`: `http://localhost:5000/api/v1`
- `accessToken`: (set after login)
- `refreshToken`: (set after login)

### Test Flow:

1. **Login** → Copy `accessToken` and `refreshToken` from response
2. Set `accessToken` in collection variables
3. **Get Current User** → Verify authentication works
4. **Create User** → Test user creation
5. **Get All Users** → See all users
6. **Update User** → Modify user data
7. **Delete User** → Remove test user

---

## Common Errors

### 401 Unauthorized
```json
{
  "success": false,
  "error": "No token provided"
}
```
**Solution:** Add Authorization header with Bearer token

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions"
}
```
**Solution:** Login with admin account

### 409 Conflict
```json
{
  "success": false,
  "error": "Email already in use"
}
```
**Solution:** Use a different email address

---

## Role Permissions

| Endpoint | Super Admin | Restaurant Admin | Kitchen | Waiter | Cashier |
|----------|-------------|------------------|---------|--------|---------|
| GET /users | ✅ | ✅ (own restaurant) | ❌ | ❌ | ❌ |
| POST /users | ✅ | ✅ (own restaurant) | ❌ | ❌ | ❌ |
| PUT /users | ✅ | ✅ (own restaurant) | ❌ | ❌ | ❌ |
| DELETE /users | ✅ | ✅ (own restaurant) | ❌ | ❌ | ❌ |
| PATCH /users/:id/password | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) |

---

## Next Steps

After testing authentication, you can:

1. ✅ Test all authentication endpoints
2. ✅ Create different role users
3. ✅ Test role-based access control
4. 🚀 Continue with menu management (next feature)
