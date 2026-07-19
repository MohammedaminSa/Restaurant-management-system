import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export const seedTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding table data...');

    // Get the demo restaurant
    const restaurantResult = await client.query(
      `SELECT id FROM restaurants WHERE slug = 'demo-restaurant' LIMIT 1`
    );

    if (restaurantResult.rows.length === 0) {
      console.log('❌ Demo restaurant not found. Please run seed-menu first!');
      return;
    }

    const restaurantId = restaurantResult.rows[0].id;
    console.log(`✓ Found restaurant: ${restaurantId}`);

    // Create tables for the restaurant
    const tables = [
      // Ground Floor
      { table_number: 'T01', capacity: 2, location: 'Ground Floor - Window' },
      { table_number: 'T02', capacity: 2, location: 'Ground Floor - Window' },
      { table_number: 'T03', capacity: 4, location: 'Ground Floor - Center' },
      { table_number: 'T04', capacity: 4, location: 'Ground Floor - Center' },
      { table_number: 'T05', capacity: 6, location: 'Ground Floor - Back' },
      { table_number: 'T06', capacity: 6, location: 'Ground Floor - Back' },
      { table_number: 'T07', capacity: 8, location: 'Ground Floor - Private' },
      
      // First Floor
      { table_number: 'T08', capacity: 2, location: 'First Floor - Balcony' },
      { table_number: 'T09', capacity: 2, location: 'First Floor - Balcony' },
      { table_number: 'T10', capacity: 4, location: 'First Floor - Main' },
      { table_number: 'T11', capacity: 4, location: 'First Floor - Main' },
      { table_number: 'T12', capacity: 6, location: 'First Floor - VIP' },
      
      // Outdoor
      { table_number: 'T13', capacity: 4, location: 'Outdoor - Patio' },
      { table_number: 'T14', capacity: 4, location: 'Outdoor - Patio' },
      { table_number: 'T15', capacity: 6, location: 'Outdoor - Garden' },
    ];

    let createdCount = 0;

    for (const table of tables) {
      const qrCode = uuidv4();
      
      await client.query(
        `INSERT INTO tables 
          (restaurant_id, table_number, qr_code, capacity, location, status)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [restaurantId, table.table_number, qrCode, table.capacity, table.location, 'available']
      );

      console.log(`✓ Created table: ${table.table_number} (${table.location}) - Capacity: ${table.capacity}`);
      createdCount++;
    }

    await client.query('COMMIT');

    console.log('\n✅ Table data seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${createdCount} Tables created`);
    console.log(`   - All tables set to 'available' status`);
    console.log(`   - QR codes generated for each table`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding table data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run the seed directly
if (require.main === module) {
  seedTables()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed table data:', error);
      process.exit(1);
    });
}
