# 🎨 Visual Request Flow Diagram

## 📊 Complete Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser/Postman)                      │
│                                                                       │
│   POST http://localhost:5000/api/v1/auth/login                      │
│   {                                                                   │
│     "email": "admin@restaurant.com",                                 │
│     "password": "admin123"                                           │
│   }                                                                   │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 1: SERVER ENTRY POINT                        │
│                    📁 backend/src/server.ts                          │
│                                                                       │
│   • Start Express server on port 5000                               │
│   • Connect to PostgreSQL database                                   │
│   • Connect to Redis (optional)                                      │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STEP 2: EXPRESS APP SETUP                          │
│                   📁 backend/src/app.ts                              │
│                                                                       │
│   Middleware Chain (runs in order):                                 │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │  1. helmet()      → Add security headers                    │   │
│   │  2. cors()        → Check origin (localhost:5173)          │   │
│   │  3. express.json()→ Parse JSON request body                │   │
│   │  4. morgan()      → Log: "POST /api/v1/auth/login"        │   │
│   └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 3: ROUTE MATCHING                            │
│                    📁 backend/src/app.ts                             │
│                                                                       │
│   app.use('/api/v1/auth', authRoutes);  ← Matches "/auth"          │
│                                                                       │
│   Routes to → backend/src/routes/auth.routes.ts                     │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 4: ROUTE HANDLER & VALIDATION                  │
│                  📁 backend/src/routes/auth.routes.ts                │
│                                                                       │
│   router.post('/login', [                                           │
│     body('email').isEmail(),      ← Validate email format           │
│     body('password').notEmpty(),  ← Validate password exists        │
│     validate,                     ← Run validation middleware        │
│   ], login);                      ← Call controller function         │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 STEP 5: VALIDATION MIDDLEWARE                        │
│                 📁 backend/src/middlewares/validator.ts              │
│                                                                       │
│   • Check if email is valid format                                  │
│   • Check if password is not empty                                   │
│                                                                       │
│   ✅ Valid → Continue to controller                                 │
│   ❌ Invalid → Return 400 error: "Valid email is required"         │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STEP 6: CONTROLLER LOGIC                           │
│                   📁 backend/src/controllers/auth.controller.ts      │
│                                                                       │
│   export const login = async (req, res) => {                        │
│     1. Extract email & password from req.body                       │
│     2. Query database for user                                       │
│     3. Verify password with bcrypt                                   │
│     4. Generate JWT tokens                                           │
│     5. Send response                                                 │
│   }                                                                   │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP 7: DATABASE QUERY                            │
│                    📁 backend/src/config/database.ts                 │
│                                                                       │
│   SQL Query:                                                         │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │  SELECT * FROM users                                        │   │
│   │  WHERE email = 'admin@restaurant.com'                       │   │
│   │  AND is_active = true                                       │   │
│   └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   Uses: pool.query(text, params)                                    │
│   Logs: "Executed query { duration: 15ms, rows: 1 }"               │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                           │
│                                                                       │
│   Table: users                                                       │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │ id              | uuid-123                                │     │
│   │ email           | admin@restaurant.com                    │     │
│   │ password_hash   | $2a$10$hashed_password...              │     │
│   │ role            | super_admin                             │     │
│   │ name            | Super Admin                             │     │
│   │ is_active       | true                                    │     │
│   └──────────────────────────────────────────────────────────┘     │
│                                                                       │
│   Returns: user object with 1 row                                   │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 8: PASSWORD VERIFICATION                       │
│                  (in auth.controller.ts)                             │
│                                                                       │
│   bcrypt.compare(                                                    │
│     'admin123',                   ← Plain text from request          │
│     '$2a$10$hashed_password...'   ← Hashed from database            │
│   )                                                                   │
│                                                                       │
│   Returns: true ✅  or  false ❌                                    │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   STEP 9: GENERATE JWT TOKENS                        │
│                   📁 backend/src/utils/jwt.ts                        │
│                                                                       │
│   Access Token:                                                      │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │ Payload: { id, email, role, restaurantId }                 │   │
│   │ Secret: JWT_SECRET                                          │   │
│   │ Expiry: 1 hour                                              │   │
│   └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│   Refresh Token:                                                     │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │ Payload: { id }                                             │   │
│   │ Secret: JWT_REFRESH_SECRET                                  │   │
│   │ Expiry: 7 days                                              │   │
│   └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  STEP 10: FORMAT RESPONSE                            │
│                  📁 backend/src/utils/responseHandler.ts             │
│                                                                       │
│   ResponseHandler.success(res, data, message)                       │
│                                                                       │
│   Creates JSON response:                                             │
│   {                                                                   │
│     "success": true,                                                 │
│     "data": { user, accessToken, refreshToken },                    │
│     "message": "Login successful"                                    │
│   }                                                                   │
└────────────────────────────────┬──────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESPONSE TO CLIENT                                │
│                    Status: 200 OK                                    │
│                                                                       │
│   {                                                                   │
│     "success": true,                                                 │
│     "data": {                                                         │
│       "user": {                                                       │
│         "id": "uuid-123",                                            │
│         "email": "admin@restaurant.com",                             │
│         "role": "super_admin",                                       │
│         "name": "Super Admin"                                        │
│       },                                                              │
│       "accessToken": "eyJhbGciOiJIUzI1NiIs...",                     │
│       "refreshToken": "eyJhbGciOiJIUzI1NiIs..."                     │
│     },                                                                │
│     "message": "Login successful"                                    │
│   }                                                                   │
│                                                                       │
│   Response Time: ~45ms                                               │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Error Flow (If Password Wrong)

```
Client sends wrong password
         ↓
Steps 1-7 (same as above)
         ↓
┌─────────────────────────────────────┐
│   bcrypt.compare() returns false    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ throw new AppError(                 │
│   'Invalid email or password', 401  │
│ )                                   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Error Handler Middleware           │
│  📁 middlewares/errorHandler.ts     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Response to Client:                │
│  Status: 401 Unauthorized           │
│  {                                  │
│    "success": false,                │
│    "error": "Invalid email or       │
│             password"               │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 📦 File Structure with Flow Numbers

```
backend/
├── src/
│   ├── server.ts                    [1] Entry point
│   ├── app.ts                       [2] Express setup
│   │
│   ├── routes/
│   │   └── auth.routes.ts           [4] Route definition
│   │
│   ├── middlewares/
│   │   ├── validator.ts             [5] Input validation
│   │   ├── auth.ts                  [Protected routes]
│   │   └── errorHandler.ts          [Error handling]
│   │
│   ├── controllers/
│   │   └── auth.controller.ts       [6] Business logic
│   │
│   ├── config/
│   │   ├── database.ts              [7] Database queries
│   │   └── redis.ts                 [Caching]
│   │
│   ├── utils/
│   │   ├── jwt.ts                   [9] Token generation
│   │   └── responseHandler.ts       [10] Response formatting
│   │
│   └── interfaces/
│       └── index.ts                 [TypeScript types]
│
├── .env                             [Environment variables]
└── package.json                     [Dependencies]
```

---

## 🎯 Key Concepts

### 1. Middleware Chain
```
Request → helmet → cors → json → morgan → routes → controller → response
```

### 2. MVC Pattern
```
Model (database.ts) ← → Controller (auth.controller.ts) ← → View (responseHandler.ts)
```

### 3. Error Handling
```
try/catch in controller → asyncHandler → errorHandler middleware → formatted error response
```

### 4. Security Layers
```
CORS → Helmet → Input Validation → Password Hash → JWT → Parameterized Queries
```

---

## 💡 Pro Tips

1. **Console Logs:** Check terminal while testing - you'll see database queries logged!
2. **Breakpoints:** Use VS Code debugger to step through each file
3. **Postman:** Watch the response time and status codes
4. **Database:** Use pgAdmin to see the actual data in PostgreSQL

---

**Visual learning complete! Now you can trace any API request! 🎉**
