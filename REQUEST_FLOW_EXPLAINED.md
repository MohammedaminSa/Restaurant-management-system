# 🔄 Complete Request Flow - LOGIN Route

This document explains **exactly** where your code starts and ends when a user logs in.

---

## 📍 The Journey: `POST /api/v1/auth/login`

```
Client Request → Server → Middleware → Route → Controller → Database → Response
```

---

## 🚀 Step-by-Step Flow

### **STEP 1: Server Starts** 
📁 **File:** `backend/src/server.ts`

```typescript
// Line 1-54: Server Entry Point
const startServer = async () => {
  // 1. Test database connection
  await pool.query('SELECT NOW()');
  
  // 2. Connect to Redis (optional)
  await connectRedis();
  
  // 3. Start Express server on port 5000
  const server = app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}

startServer(); // ← SERVER STARTS HERE
```

**What happens:**
- Connects to PostgreSQL database
- Optionally connects to Redis
- Starts Express server listening on port 5000

---

### **STEP 2: Request Arrives**
📁 **File:** `backend/src/app.ts`

```typescript
// Line 1-60: Express App Configuration

// When request comes in, it passes through middleware FIRST:

// 1. SECURITY: Helmet adds security headers
app.use(helmet());

// 2. CORS: Allows requests from frontend (localhost:5173)
app.use(cors(corsOptions));

// 3. BODY PARSER: Converts JSON request body to JavaScript object
app.use(express.json());

// 4. LOGGING: Morgan logs the request
app.use(morgan('dev'));
// Output: POST /api/v1/auth/login 200 123ms

// 5. ROUTE MATCHING: Express finds the matching route
app.use('/api/v1/auth', authRoutes); // ← LOGIN ROUTE IS HERE
```

**Request Example:**
```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@restaurant.com",
  "password": "admin123"
}
```

---

### **STEP 3: Route Handler**
📁 **File:** `backend/src/routes/auth.routes.ts`

```typescript
// Line 9-17: Login Route Definition

router.post(
  '/login',
  [
    // VALIDATION RULES (express-validator)
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate, // ← Runs validator middleware
  ],
  login // ← Calls login controller
);
```

**What happens:**
1. Checks if `email` is a valid email format
2. Checks if `password` is not empty
3. Runs `validate` middleware

---

### **STEP 4: Validation Middleware**
📁 **File:** `backend/src/middlewares/validator.ts`

```typescript
// Line 4-13: Validation Logic

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // IF VALIDATION FAILS: Send 400 error
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return ResponseHandler.badRequest(res, errorMessages);
  }
  
  // IF VALIDATION PASSES: Continue to controller
  next();
};
```

**Example Error Response (if invalid):**
```json
{
  "success": false,
  "error": "Valid email is required"
}
```

---

### **STEP 5: Login Controller**
📁 **File:** `backend/src/controllers/auth.controller.ts`

```typescript
// Line 9-40: Login Logic

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // 1. QUERY DATABASE: Find user by email
  const result = await query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  const user = result.rows[0];

  // 2. CHECK USER EXISTS
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // 3. VERIFY PASSWORD: Compare with hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // 4. GENERATE JWT TOKENS
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 5. REMOVE PASSWORD FROM RESPONSE
  delete user.password_hash;

  // 6. SEND SUCCESS RESPONSE
  return ResponseHandler.success(res, {
    user,
    accessToken,
    refreshToken,
  }, 'Login successful');
});
```

---

### **STEP 6: Database Query**
📁 **File:** `backend/src/config/database.ts`

```typescript
// Line 26-37: Query Execution

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    // Execute SQL query
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};
```

**SQL Executed:**
```sql
SELECT * FROM users 
WHERE email = 'admin@restaurant.com' 
AND is_active = true
```

**Database Returns:**
```javascript
{
  rows: [
    {
      id: 'uuid-here',
      email: 'admin@restaurant.com',
      password_hash: '$2a$10$hashed_password',
      role: 'super_admin',
      name: 'Super Admin',
      // ... other fields
    }
  ],
  rowCount: 1
}
```

---

### **STEP 7: Password Verification**

```typescript
// Uses bcrypt to compare passwords
const isPasswordValid = await bcrypt.compare(
  'admin123',                          // Plain text password from request
  '$2a$10$hashed_password'            // Hashed password from database
);
// Returns: true or false
```

---

### **STEP 8: JWT Token Generation**
📁 **File:** `backend/src/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';

export const generateAccessToken = (user: any): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurant_id,
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};
```

**Token Created:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InV1aWQtaGVyZSIsImVtYWlsIjoiYWRtaW5AcmVzdGF1cmFudC5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNDU3MTQ5MH0.abc123xyz
```

---

### **STEP 9: Response Sent**
📁 **File:** `backend/src/utils/responseHandler.ts`

```typescript
// Line 6-14: Success Response

static success<T>(res: Response, data?: T, message?: string, statusCode = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(response);
}
```

**Final Response to Client:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@restaurant.com",
      "role": "super_admin",
      "restaurant_id": null,
      "name": "Super Admin",
      "phone": null,
      "avatar_url": null,
      "is_active": true,
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

---

## 🔢 Complete Flow Summary

```
1. CLIENT SENDS REQUEST
   ↓
2. server.ts → Server is listening on port 5000
   ↓
3. app.ts → Request passes through middleware:
   - helmet() → Security headers
   - cors() → CORS check
   - express.json() → Parse JSON body
   - morgan() → Log request
   ↓
4. app.ts → Route matching: /api/v1/auth → authRoutes
   ↓
5. auth.routes.ts → POST /login → Validation rules
   ↓
6. validator.ts → validate() → Check email & password format
   ↓
7. auth.controller.ts → login() function:
   ↓
8. database.ts → query() → SELECT user from database
   ↓
9. PostgreSQL → Returns user data
   ↓
10. auth.controller.ts → bcrypt.compare() → Verify password
    ↓
11. jwt.ts → generateAccessToken() → Create JWT tokens
    ↓
12. responseHandler.ts → success() → Format response
    ↓
13. CLIENT RECEIVES RESPONSE with tokens
```

---

## 📂 Files Involved (In Order)

| # | File | Purpose |
|---|------|---------|
| 1 | `server.ts` | Server entry point |
| 2 | `app.ts` | Express app & middleware setup |
| 3 | `auth.routes.ts` | Route definition & validation |
| 4 | `validator.ts` | Input validation |
| 5 | `auth.controller.ts` | Business logic |
| 6 | `database.ts` | Database query execution |
| 7 | `jwt.ts` | Token generation |
| 8 | `responseHandler.ts` | Response formatting |

---

## 🧪 Testing the Flow

### Using Postman:
```
1. Import: Restaurant-API.postman_collection.json
2. Open: Auth → Login
3. Click: Send
4. Watch: Console logs in terminal show the flow!
```

### Using cURL:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin123"}'
```

### Console Output (in your terminal):
```
Executed query { text: 'SELECT * FROM users WHERE email = $1...', duration: 15, rows: 1 }
POST /api/v1/auth/login 200 45ms
```

---

## 🎯 Key Takeaways

1. **Request Flow:** Client → Middleware → Routes → Controller → Database → Response
2. **Middleware Chain:** Security → CORS → Parsing → Logging → Validation
3. **Controller Logic:** Fetch data → Verify → Generate tokens → Respond
4. **Database:** PostgreSQL stores user data, queries are executed via pool
5. **Response:** Always formatted using ResponseHandler for consistency

---

## 🔐 Security Features in Login Flow

✅ **Password Hashing:** bcrypt (never store plain text)
✅ **JWT Tokens:** Secure authentication (expire after 1 hour)
✅ **Input Validation:** email format & required fields
✅ **SQL Injection Protection:** Parameterized queries ($1, $2)
✅ **Error Messages:** Generic "Invalid email or password" (don't reveal which is wrong)
✅ **CORS Protection:** Only allow requests from localhost:5173
✅ **Security Headers:** Helmet adds protective HTTP headers

---

**Now you understand the complete journey! 🚀**

Every API request follows this same pattern - just with different routes, controllers, and database queries!
