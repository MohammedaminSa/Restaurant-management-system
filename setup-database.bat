@echo off
echo ========================================
echo Database Setup
echo ========================================
echo.

echo Creating database...
psql -U postgres -c "CREATE DATABASE restaurant_db" 2>nul
if %errorlevel% equ 0 (
    echo ✓ Database created successfully
) else (
    echo ℹ Database may already exist (this is OK)
)
echo.

echo Running schema migration...
cd backend
psql -U postgres -d restaurant_db -f src/database/schema.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to run schema
    echo.
    echo Make sure:
    echo 1. PostgreSQL is installed
    echo 2. PostgreSQL service is running
    echo 3. You can connect with: psql -U postgres
    echo.
    pause
    exit /b 1
)
echo ✓ Schema created successfully
echo.

echo Seeding database with test data...
call npm run seed
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed database
    pause
    exit /b 1
)
echo.

echo ========================================
echo Database Setup Complete!
echo ========================================
echo.
echo Test users created:
echo - Super Admin: admin@restaurant.com / admin123
echo - Restaurant Admin: restaurant@demo.com / admin123
echo - Kitchen Staff: kitchen@demo.com / kitchen123
echo - Waiter: waiter@demo.com / waiter123
echo - Cashier: cashier@demo.com / cashier123
echo.
echo You can now start the server with: cd backend ^& npm run dev
echo.
pause
