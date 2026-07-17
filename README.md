# 🍽️ Smart Restaurant Menu & Ordering System

A modern, web-based Progressive Web App (PWA) restaurant ordering system that enables customers to scan QR codes, browse menus, customize orders, and submit them directly to the kitchen with real-time updates.

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Quick Setup](#-quick-setup)
- [API Testing](#-api-testing)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Environment Variables](#-environment-variables)
- [Development Status](#-development-status)

---

## 🚀 Features

### 👥 Customer Features
- 📱 QR code menu access (no login required)
- 🍽️ Browse menu by categories with images
- 🔍 Search and filter menu items
- ⚙️ Customize orders with variants (size, spice level, etc.)
- 🛒 Shopping cart with real-time updates
- 📊 Track order status in real-time
- 💵 View session bill

### 👨‍🍳 Kitchen Staff Features
- 📋 View incoming orders by priority
- ✅ Update order status (preparing, ready)
- ⏱️ Track preparation time
- 🔔 Real-time order notifications

### 🧑‍💼 Waiter Features
- 🪑 Manage tables and assignments
- 📝 Place orders on behalf of customers
- 🍽️ Mark orders as served
- 👥 View customer session details

### 💰 Cashier Features
- 💳 Process payments (cash, card, digital wallet)
- 🧾 Generate bills and invoices
- 📄 Print/email receipts
- 📊 View transaction history

### 🔧 Admin Features
- 📊 Comprehensive dashboard with analytics
- 🍔 Full menu management (CRUD)
- 🏷️ Category management
- 🪑 Table management with QR code generation
- 👥 User management (staff accounts)
- 📦 Inventory tracking
- 🎁 Promotion management
- 📈 Sales reports and analytics
- ⚙️ Restaurant settings

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ **React 19** with TypeScript
- ⚡ **Vite** - Fast build tooling
- 🎨 **Material-UI (MUI)** - Component library
- 🔄 **React Query** - Server state management
- 🌐 **React Router** - Navigation
- 📱 **PWA** - Progressive Web App support

### Backend
- 🟢 **Node.js** with **Express.js**
- 📘 **TypeScript**
- 🐘 **PostgreSQL** - Primary database
- 🔴 **Redis** (Optional) - Caching layer
- 🔐 **JWT** - Authentication
- 🔌 **WebSocket** - Real-time updates

### Infrastructure
- 🐳 **Docker** - Containerization
- ☁️ Cloud-ready deployment

---

## 🚀 Quick Setup

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)
- **Redis** (Optional) - See `backend/REDIS_SETUP.md`

---

### Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd restaurant-ordering-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Setup Database

**Option A: Using Windows Batch Script**
```bash
# From project root
setup-database.bat
```

**Option B: Manual Setup**
```bash
# 1. Connect to PostgreSQL
psql -U postgres

# 2. Create database
CREATE DATABASE restaurant_db;

# 3. Exit psql
\q

# 4. Run schema
psql -U postgres -d restaurant_db -f backend/create-db.sql
```

---

### Step 3: Configure Environment

```bash
# Backend: Copy and edit .env file
cd backend
copy .env.example .env
# Edit .env with your database credentials
```

**Key Variables to Update in `backend/.env`:**
```env
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
REDIS_ENABLED=false  # Set to true if using Redis
```

---

### Step 4: Seed Test Data

```bash
# From backend directory
npm run seed
```

This creates 5 test users:
- **Super Admin**: `admin@restaurant.com` / `admin123`
- **Restaurant Admin**: `restaurant@demo.com` / `admin123`
- **Kitchen Staff**: `kitchen@demo.com` / `kitchen123`
- **Waiter**: `waiter@demo.com` / `waiter123`
- **Cashier**: `cashier@demo.com` / `cashier123`

---

### Step 5: Start Development Servers

**Option A: Using Batch Scripts**
```bash
# Terminal 1 - Backend
start-backend.bat

# Terminal 2 - Frontend
start-frontend.bat
```

**Option B: Manual Start**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Servers:**
- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## 🧪 API Testing

### Using Postman

1. **Import Collection**
   - Open Postman
   - Click **Import**
   - Select `Restaurant-API.postman_collection.json`

2. **Test Endpoints**
   ```
   Health Check: GET http://localhost:5000/health
   Login:        POST http://localhost:5000/api/v1/auth/login
   Get Profile:  GET http://localhost:5000/api/v1/auth/me
   List Users:   GET http://localhost:5000/api/v1/users
   ```

3. **Auto Token Management**
   - Login automatically saves JWT token
   - All protected routes use saved token

### Quick cURL Tests

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@restaurant.com\",\"password\":\"admin123\"}"
```

**Full API Reference:** See `API_ENDPOINTS.md`

---

## 📁 Project Structure

```
restaurant-ordering-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis config
│   │   ├── controllers/     # Route handlers
│   │   ├── middlewares/     # Auth, validation, errors
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Helper functions
│   │   ├── interfaces/      # TypeScript types
│   │   ├── database/        # Schema & seed scripts
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── new-frontend/
│   ├── src/
│   │   ├── routes/          # TanStack Router routes
│   │   ├── components/      # UI components
│   │   └── lib/             # Utilities & API client
│   ├── package.json
│   └── vite.config.ts
│
├── .kiro/
│   └── specs/               # Design specifications
│
├── README.md                # This file
├── API_ENDPOINTS.md         # Complete API reference
├── docker-compose.yml       # Docker configuration
└── *.bat                    # Windows setup scripts
```

---

## 📝 Available Scripts

### Backend Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Run production build
npm run seed     # Seed database with test users
npm run lint     # Run ESLint
```

### Frontend Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🔐 Environment Variables

### Backend `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis (Optional)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 📊 Development Status

### ✅ Completed (Phase 1)
- [x] Backend server setup (Express + TypeScript)
- [x] PostgreSQL database (15 tables)
- [x] Authentication system (JWT)
- [x] User management (CRUD)
- [x] Role-based access control (5 roles)
- [x] API documentation
- [x] Postman collection
- [x] Database seeding
- [x] Docker configuration
- [x] Windows setup scripts

### 🚧 In Progress
- [ ] Frontend UI development
- [ ] Menu management
- [ ] Table management
- [ ] Order system
- [ ] Kitchen dashboard
- [ ] Payment processing

### 📅 Planned
- [ ] Real-time WebSocket notifications
- [ ] QR code generation
- [ ] PWA features
- [ ] Admin dashboard
- [ ] Analytics & reporting
- [ ] Multi-restaurant support

---

## 🔧 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready -U postgres

# Verify credentials in backend/.env
```

### Port Already in Use
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <process_id> /F
```

### Redis Connection Errors
Redis is **optional**. Set `REDIS_ENABLED=false` in `backend/.env`

See `backend/REDIS_SETUP.md` for full Redis configuration guide.

---

## 📚 Documentation

- **API Reference**: `API_ENDPOINTS.md`
- **Redis Setup**: `backend/REDIS_SETUP.md`
- **Design Specs**: `.kiro/specs/restaurant-ordering-system/`
  - `spec.md` - Complete system design
  - `tasks.md` - Implementation roadmap

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

[Your chosen license]

---

## 📧 Contact

[Your contact information]

---

**Built with ❤️ for better restaurant experiences**
