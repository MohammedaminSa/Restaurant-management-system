import bcrypt from 'bcryptjs';
import { pool, query } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

export async function runSeed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create a restaurant
    const restaurantResult = await query(
      `INSERT INTO restaurants (name, slug, description, timezone, currency, tax_rate, service_charge_rate) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [
        'Demo Restaurant',
        'demo-restaurant',
        'A demo restaurant for testing',
        'Africa/Addis_Ababa',
        'USD',
        10.0,
        5.0
      ]
    );

    let restaurantId: string;

    if (restaurantResult.rows.length > 0) {
      restaurantId = restaurantResult.rows[0].id;
      console.log('✓ Created restaurant:', restaurantId);
    } else {
      // Restaurant already exists, get its ID
      const existing = await query('SELECT id FROM restaurants WHERE slug = $1', ['demo-restaurant']);
      restaurantId = existing.rows[0].id;
      console.log('✓ Restaurant already exists:', restaurantId);
    }

    // Create super admin
    const superAdminPassword = await bcrypt.hash('admin123', 10);
    const superAdminResult = await query(
      `INSERT INTO users (email, password_hash, role, name) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['admin@restaurant.com', superAdminPassword, 'super_admin', 'Super Admin']
    );

    if (superAdminResult.rows.length > 0) {
      console.log('✓ Created super admin: admin@restaurant.com');
    } else {
      console.log('✓ Super admin already exists');
    }

    // Create restaurant admin
    const restaurantAdminPassword = await bcrypt.hash('admin123', 10);
    const restaurantAdminResult = await query(
      `INSERT INTO users (email, password_hash, role, restaurant_id, name) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['restaurant@demo.com', restaurantAdminPassword, 'restaurant_admin', restaurantId, 'Restaurant Admin']
    );

    if (restaurantAdminResult.rows.length > 0) {
      console.log('✓ Created restaurant admin: restaurant@demo.com');
    } else {
      console.log('✓ Restaurant admin already exists');
    }

    // Create kitchen staff
    const kitchenPassword = await bcrypt.hash('kitchen123', 10);
    const kitchenResult = await query(
      `INSERT INTO users (email, password_hash, role, restaurant_id, name) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['kitchen@demo.com', kitchenPassword, 'kitchen_staff', restaurantId, 'Kitchen Staff']
    );

    if (kitchenResult.rows.length > 0) {
      console.log('✓ Created kitchen staff: kitchen@demo.com');
    } else {
      console.log('✓ Kitchen staff already exists');
    }

    // Create waiter
    const waiterPassword = await bcrypt.hash('waiter123', 10);
    const waiterResult = await query(
      `INSERT INTO users (email, password_hash, role, restaurant_id, name) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['waiter@demo.com', waiterPassword, 'waiter', restaurantId, 'Waiter']
    );

    if (waiterResult.rows.length > 0) {
      console.log('✓ Created waiter: waiter@demo.com');
    } else {
      console.log('✓ Waiter already exists');
    }

    // Create cashier
    const cashierPassword = await bcrypt.hash('cashier123', 10);
    const cashierResult = await query(
      `INSERT INTO users (email, password_hash, role, restaurant_id, name) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['cashier@demo.com', cashierPassword, 'cashier', restaurantId, 'Cashier']
    );

    if (cashierResult.rows.length > 0) {
      console.log('✓ Created cashier: cashier@demo.com');
    } else {
      console.log('✓ Cashier already exists');
    }

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Seeded accounts:');
    console.log('Super Admin: admin@restaurant.com');
    console.log('Restaurant Admin: restaurant@demo.com');
    console.log('Kitchen Staff: kitchen@demo.com');
    console.log('Waiter: waiter@demo.com');
    console.log('Cashier: cashier@demo.com');
    console.log('(Default passwords are set — change in production)');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runSeed();
}
