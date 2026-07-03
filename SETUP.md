# Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (v6 or higher) - [Download](https://redis.io/download/)
- **Git** - [Download](https://git-scm.com/)

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env file with your configuration
# Update database credentials, JWT secrets, etc.
```

### 4. Set Up Database

**Create Database:**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE restaurant_db;

-- Exit psql
\q
```

**Run Schema Migration:**
```bash
# Option 1: Using psql command line
psql -U postgres -d restaurant_db -f src/database/schema.sql

# Option 2: Using pgAdmin
# Open pgAdmin, connect to your database
# Open Query Tool and paste contents of src/database/schema.sql
# Execute the query
```

### 5. Start Redis
```bash
# Windows (if installed via MSI)
redis-server

# Or if using WSL/Linux
sudo service redis-server start
```

### 6. Start Backend Server
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

The backend server should now be running on **http://localhost:5000**

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
# Copy the example environment file
copy .env.example .env

# The default values should work for local development
```

### 4. Start Frontend Server
```bash
npm run dev
```

The frontend should now be running on **http://localhost:5173**

## Verify Installation

### 1. Check Backend Health
Open browser or use curl:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Check Database Connection
Look for these messages in backend console:
```
✓ Database connected successfully
✓ Database connection test passed
```

### 3. Check Redis Connection
Look for this message in backend console:
```
✓ Redis connected successfully
✓ Redis client ready
```

### 4. Access Frontend
Open browser and navigate to:
```
http://localhost:5173
```

## Troubleshooting

### Database Connection Issues

**Error: "password authentication failed"**
- Verify PostgreSQL credentials in `.env` file
- Ensure PostgreSQL service is running
- Check `pg_hba.conf` for authentication settings

**Error: "database does not exist"**
- Create the database: `CREATE DATABASE restaurant_db;`
- Verify database name in `.env` matches

### Redis Connection Issues

**Error: "Redis connection refused"**
- Ensure Redis server is running
- Check Redis port (default: 6379)
- Verify Redis configuration in `.env`

### Port Already in Use

**Backend (Port 5000):**
```bash
# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

**Frontend (Port 5173):**
```bash
# Windows - Find and kill process
netstat -ano | findstr :5173
taskkill /PID <process_id> /F
```

### TypeScript Path Alias Errors

If you see import errors with `@` aliases:
```bash
# Restart VS Code TypeScript server
# Press Ctrl+Shift+P
# Type: "TypeScript: Restart TS Server"
```

## Development Workflow

### Backend Development
```bash
cd backend
npm run dev  # Auto-restarts on file changes
```

### Frontend Development
```bash
cd frontend
npm run dev  # Hot module replacement enabled
```

### Running Both Concurrently
From project root, you can open two terminals:

**Terminal 1 (Backend):**
```bash
cd backend && npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
```

## Next Steps

After successful setup:

1. ✅ Backend and frontend are running
2. ✅ Database schema is created
3. ✅ Redis is connected

You're ready to start development! Check the spec files in `.kiro/specs/restaurant-ordering-system/` for:
- **spec.md** - Complete system design
- **tasks.md** - Implementation roadmap

## Useful Commands

### Backend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Run ESLint
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Database Management

### Reset Database
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS restaurant_db;"
psql -U postgres -c "CREATE DATABASE restaurant_db;"
psql -U postgres -d restaurant_db -f src/database/schema.sql
```

### Backup Database
```bash
pg_dump -U postgres restaurant_db > backup.sql
```

### Restore Database
```bash
psql -U postgres -d restaurant_db < backup.sql
```

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the design specs in `.kiro/specs/`
- Create an issue in the GitHub repository
