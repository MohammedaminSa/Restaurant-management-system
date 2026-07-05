@echo off
echo ========================================
echo Restaurant Ordering System - Setup
echo ========================================
echo.

echo Step 1: Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo Step 2: Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

cd ..
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Install PostgreSQL: https://www.postgresql.org/download/windows/
echo 2. Create database: psql -U postgres -c "CREATE DATABASE restaurant_db"
echo 3. Run schema: cd backend ^& psql -U postgres -d restaurant_db -f src/database/schema.sql
echo 4. Seed data: cd backend ^& npm run seed
echo 5. Start server: cd backend ^& npm run dev
echo.
pause
