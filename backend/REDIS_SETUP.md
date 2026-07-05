# Redis Configuration Guide

## Current Status: Redis is DISABLED

The application is currently configured to run **WITHOUT** Redis. This means:
- ✅ No Redis installation required
- ✅ No Redis connection errors
- ✅ App runs perfectly fine without caching
- ⚠️ Slightly reduced performance (no caching layer)

---

## How to Enable Redis (When Needed)

### Step 1: Install Redis

**Windows:**
```bash
# Option 1: Using Chocolatey
choco install redis-64

# Option 2: Download MSI installer
# Visit: https://github.com/microsoftarchive/redis/releases

# Option 3: Use WSL (Windows Subsystem for Linux)
wsl --install
sudo apt-get update
sudo apt-get install redis-server
```

**After Installation, Start Redis:**
```bash
# Windows (if installed natively)
redis-server

# WSL
sudo service redis-server start
```

### Step 2: Enable Redis in Application

Edit `backend/.env` file:
```env
# Change this line from false to true
REDIS_ENABLED=true
```

### Step 3: Restart Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✓ Redis connected successfully
✓ Redis client ready
```

---

## How to Disable Redis (Current Setting)

Edit `backend/.env` file:
```env
# Set to false
REDIS_ENABLED=false
```

The application will show:
```
ℹ️  Redis disabled - running without cache
```

---

## Using Docker Compose with Redis

If you want to use Redis via Docker, uncomment the Redis service in `docker-compose.yml`:

```yaml
# Uncomment this section:
redis:
  image: redis:7-alpine
  container_name: restaurant_redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

Then set in `.env`:
```env
REDIS_ENABLED=true
REDIS_HOST=localhost  # or 'redis' if running backend in Docker
REDIS_PORT=6379
```

---

## Benefits of Using Redis (Future)

When you enable Redis, you'll get:
- 🚀 **Faster API responses** - Cached data retrieval
- 💾 **Session storage** - User sessions stored in Redis
- 🔔 **Real-time features** - WebSocket message queuing
- 📊 **Rate limiting** - Track API request rates
- 🎯 **Better performance** - Under high load

---

## Testing Redis Connection

Once enabled, test Redis:

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Check Redis connection from app
curl http://localhost:5000/health
```

---

## Current Setup Summary

```
✅ REDIS_ENABLED=false
✅ App works perfectly without Redis
✅ No installation required
✅ No connection errors
```

**You can enable Redis later when you need caching/sessions!**
