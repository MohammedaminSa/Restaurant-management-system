import { query } from '@config/database';

const migrations = [
  `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method payment_method`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid'`,
  `ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'bank_transfer'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_account JSONB`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE`,
];

export async function runMigrations() {
  for (const sql of migrations) {
    try {
      await query(sql);
      console.log(`✓ Migration: ${sql.split(' ').slice(2, 5).join(' ')}`);
    } catch (err: any) {
      console.error(`✗ Migration failed: ${sql} — ${err.message}`);
    }
  }
}
