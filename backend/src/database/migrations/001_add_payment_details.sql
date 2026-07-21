-- Migration: Add payment_details to restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

-- Note: payment_method and payment_status on orders were already added
-- in schema.sql migrations section. If not present, uncomment:
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method payment_method;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';
