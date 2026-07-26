import bcrypt from 'bcryptjs';
import { pool, query } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

export async function runSeed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create super admin only — everything else is managed via the UI
    const hash = await bcrypt.hash('admin123', 10);
    await query(
      `INSERT INTO users (email, password_hash, role, name) 
       VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING`,
      ['admin@restaurant.com', hash, 'super_admin', 'Super Admin']
    );
    console.log('✓ Super admin: admin@restaurant.com');

    console.log('\n✅ Seed completed! Login as super admin to create restaurants and staff via the dashboard.');

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
