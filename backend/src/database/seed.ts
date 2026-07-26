import bcrypt from 'bcryptjs';
import { pool, query } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function seedRestaurant(name: string, slug: string, desc: string) {
  const result = await query(
    `INSERT INTO restaurants (name, slug, description, timezone, currency, tax_rate, service_charge_rate) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     ON CONFLICT (slug) DO NOTHING
     RETURNING id`,
    [name, slug, desc, 'Africa/Addis_Ababa', 'USD', 10.0, 5.0]
  );

  if (result.rows.length > 0) {
    console.log(`✓ Created restaurant: ${name}`);
    return result.rows[0].id;
  }
  const existing = await query('SELECT id FROM restaurants WHERE slug = $1', [slug]);
  console.log(`✓ Restaurant already exists: ${name}`);
  return existing.rows[0].id;
}

async function seedUser(email: string, password: string, role: string, name: string, restaurantId?: string) {
  const hash = await bcrypt.hash(password, 10);
  if (restaurantId) {
    await query(
      `INSERT INTO users (email, password_hash, role, restaurant_id, name) 
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING`,
      [email, hash, role, restaurantId, name]
    );
  } else {
    await query(
      `INSERT INTO users (email, password_hash, role, name) 
       VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      [email, hash, role, name]
    );
  }
  console.log(`✓ Created ${role}: ${email}`);
}

export async function runSeed() {
  try {
    console.log('🌱 Starting database seed...');

    const restaurant1Id = await seedRestaurant('Ocean View Restaurant', 'ocean-view', 'Seaside dining with fresh seafood');
    const restaurant2Id = await seedRestaurant('Mountain Lodge Bistro', 'mountain-lodge', 'Cozy mountain retreat with hearty meals');

    // Create super admin
    await seedUser('admin@restaurant.com', 'admin123', 'super_admin', 'Super Admin');

    // Restaurant 1 staff
    await seedUser('restaurant@demo.com', 'admin123', 'restaurant_admin', 'Restaurant Admin', restaurant1Id);
    await seedUser('kitchen@demo.com', 'kitchen123', 'kitchen_staff', 'Kitchen Staff', restaurant1Id);
    await seedUser('waiter@demo.com', 'waiter123', 'waiter', 'Waiter', restaurant1Id);
    await seedUser('cashier@demo.com', 'cashier123', 'cashier', 'Cashier', restaurant1Id);

    // Restaurant 2 staff
    await seedUser('admin2@demo.com', 'admin123', 'restaurant_admin', 'Restaurant Admin 2', restaurant2Id);
    await seedUser('kitchen2@demo.com', 'kitchen123', 'kitchen_staff', 'Kitchen Staff 2', restaurant2Id);
    await seedUser('waiter2@demo.com', 'waiter123', 'waiter', 'Waiter 2', restaurant2Id);
    await seedUser('cashier2@demo.com', 'cashier123', 'cashier', 'Cashier 2', restaurant2Id);

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Seeded accounts:');
    console.log('Super Admin: admin@restaurant.com');
    console.log('─ Restaurant 1 (Ocean View):');
    console.log('  Admin: restaurant@demo.com / Kitchen: kitchen@demo.com / Waiter: waiter@demo.com / Cashier: cashier@demo.com');
    console.log('─ Restaurant 2 (Mountain Lodge):');
    console.log('  Admin: admin2@demo.com / Kitchen: kitchen2@demo.com / Waiter: waiter2@demo.com / Cashier: cashier2@demo.com');
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
