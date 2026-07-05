-- Create database if it doesn't exist
-- Run this with: psql -U postgres -f create-db.sql

SELECT 'CREATE DATABASE restaurant_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'restaurant_db')\gexec
