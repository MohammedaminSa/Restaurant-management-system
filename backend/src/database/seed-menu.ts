import { pool } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

export const seedMenuData = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding menu data...');

    // Create a demo restaurant first
    const restaurantResult = await client.query(
      `INSERT INTO restaurants (name, slug, description, address, phone, email, tax_rate, service_charge_rate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`,
      [
        'Demo Restaurant',
        'demo-restaurant',
        'A wonderful restaurant serving delicious food',
        '123 Main Street, City, Country',
        '+1234567890',
        'demo@restaurant.com',
        10.00, // 10% tax
        5.00,  // 5% service charge
      ]
    );

    const restaurantId = restaurantResult.rows[0].id;
    console.log(`✓ Created restaurant: ${restaurantId}`);

    // Create categories
    const categories = [
      {
        name: 'Appetizers',
        description: 'Start your meal with our delicious appetizers',
        display_order: 1,
      },
      {
        name: 'Main Course',
        description: 'Hearty and satisfying main dishes',
        display_order: 2,
      },
      {
        name: 'Desserts',
        description: 'Sweet treats to end your meal',
        display_order: 3,
      },
      {
        name: 'Beverages',
        description: 'Refreshing drinks and beverages',
        display_order: 4,
      },
      {
        name: 'Specials',
        description: "Chef's special recommendations",
        display_order: 5,
      },
    ];

    const categoryIds: Record<string, string> = {};

    for (const category of categories) {
      const result = await client.query(
        `INSERT INTO categories (restaurant_id, name, description, display_order)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name`,
        [restaurantId, category.name, category.description, category.display_order]
      );
      categoryIds[category.name] = result.rows[0].id;
      console.log(`✓ Created category: ${category.name}`);
    }

    // Create menu items
    const menuItems = [
      // Appetizers
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with parmesan cheese, croutons, and Caesar dressing',
        category: 'Appetizers',
        base_price: 8.99,
        preparation_time: 10,
        is_featured: true,
        dietary_info: { vegetarian: true, gluten_free: false },
        allergens: ['dairy', 'gluten'],
      },
      {
        name: 'Buffalo Wings',
        description: 'Crispy chicken wings tossed in spicy buffalo sauce',
        category: 'Appetizers',
        base_price: 12.99,
        preparation_time: 15,
        dietary_info: { spicy: true },
        allergens: ['dairy'],
      },
      {
        name: 'Mozzarella Sticks',
        description: 'Golden fried mozzarella with marinara sauce',
        category: 'Appetizers',
        base_price: 9.99,
        preparation_time: 12,
        dietary_info: { vegetarian: true },
        allergens: ['dairy', 'gluten'],
      },
      
      // Main Course
      {
        name: 'Classic Burger',
        description: 'Juicy beef patty with lettuce, tomato, onion, pickles, and special sauce',
        category: 'Main Course',
        base_price: 14.99,
        preparation_time: 20,
        is_featured: true,
        allergens: ['gluten', 'dairy'],
      },
      {
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, tomato sauce, and basil on thin crust',
        category: 'Main Course',
        base_price: 16.99,
        preparation_time: 25,
        is_featured: true,
        dietary_info: { vegetarian: true },
        allergens: ['gluten', 'dairy'],
      },
      {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with lemon butter sauce, served with vegetables',
        category: 'Main Course',
        base_price: 24.99,
        preparation_time: 30,
        dietary_info: { gluten_free: true },
        allergens: ['fish'],
      },
      {
        name: 'Chicken Alfredo Pasta',
        description: 'Creamy alfredo sauce with grilled chicken and fettuccine',
        category: 'Main Course',
        base_price: 18.99,
        preparation_time: 25,
        allergens: ['gluten', 'dairy'],
      },
      {
        name: 'Vegetable Stir Fry',
        description: 'Fresh seasonal vegetables wok-tossed with soy sauce and garlic',
        category: 'Main Course',
        base_price: 13.99,
        preparation_time: 18,
        dietary_info: { vegetarian: true, vegan: true },
        allergens: ['soy'],
      },
      {
        name: 'BBQ Ribs',
        description: 'Slow-cooked pork ribs with smoky BBQ sauce',
        category: 'Main Course',
        base_price: 22.99,
        preparation_time: 35,
        allergens: [],
      },
      {
        name: 'Fish and Chips',
        description: 'Beer-battered cod with crispy fries and tartar sauce',
        category: 'Main Course',
        base_price: 16.99,
        preparation_time: 22,
        allergens: ['fish', 'gluten'],
      },
      
      // Desserts
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
        category: 'Desserts',
        base_price: 8.99,
        preparation_time: 15,
        is_featured: true,
        dietary_info: { vegetarian: true },
        allergens: ['dairy', 'eggs', 'gluten'],
      },
      {
        name: 'New York Cheesecake',
        description: 'Classic creamy cheesecake with graham cracker crust',
        category: 'Desserts',
        base_price: 7.99,
        preparation_time: 5,
        dietary_info: { vegetarian: true },
        allergens: ['dairy', 'eggs', 'gluten'],
      },
      {
        name: 'Tiramisu',
        description: 'Italian coffee-flavored dessert with mascarpone cheese',
        category: 'Desserts',
        base_price: 8.99,
        preparation_time: 5,
        dietary_info: { vegetarian: true },
        allergens: ['dairy', 'eggs', 'gluten'],
      },
      {
        name: 'Apple Pie',
        description: 'Homemade apple pie with cinnamon, served warm',
        category: 'Desserts',
        base_price: 6.99,
        preparation_time: 10,
        dietary_info: { vegetarian: true },
        allergens: ['gluten', 'dairy'],
      },
      
      // Beverages
      {
        name: 'Coca-Cola',
        description: 'Classic Coca-Cola soft drink',
        category: 'Beverages',
        base_price: 2.99,
        preparation_time: 2,
        allergens: [],
      },
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        category: 'Beverages',
        base_price: 4.99,
        preparation_time: 5,
        dietary_info: { vegan: true },
        allergens: [],
      },
      {
        name: 'Coffee',
        description: 'Freshly brewed coffee',
        category: 'Beverages',
        base_price: 3.49,
        preparation_time: 3,
        dietary_info: { vegan: true },
        allergens: [],
      },
      {
        name: 'Iced Tea',
        description: 'Refreshing iced tea with lemon',
        category: 'Beverages',
        base_price: 2.99,
        preparation_time: 2,
        dietary_info: { vegan: true },
        allergens: [],
      },
      {
        name: 'Milkshake',
        description: 'Creamy milkshake - chocolate, vanilla, or strawberry',
        category: 'Beverages',
        base_price: 5.99,
        preparation_time: 5,
        dietary_info: { vegetarian: true },
        allergens: ['dairy'],
      },
      
      // Specials
      {
        name: "Chef's Special Steak",
        description: '12oz ribeye steak cooked to perfection with herb butter',
        category: 'Specials',
        base_price: 32.99,
        preparation_time: 35,
        is_featured: true,
        allergens: ['dairy'],
      },
      {
        name: 'Seafood Paella',
        description: 'Traditional Spanish rice dish with shrimp, mussels, and calamari',
        category: 'Specials',
        base_price: 28.99,
        preparation_time: 40,
        allergens: ['shellfish'],
      },
    ];

    for (const item of menuItems) {
      const categoryId = categoryIds[item.category];
      await client.query(
        `INSERT INTO menu_items 
          (restaurant_id, category_id, name, description, base_price, preparation_time, 
           is_featured, dietary_info, allergens)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          restaurantId,
          categoryId,
          item.name,
          item.description,
          item.base_price,
          item.preparation_time,
          item.is_featured || false,
          JSON.stringify(item.dietary_info || {}),
          JSON.stringify(item.allergens || []),
        ]
      );
      console.log(`✓ Created menu item: ${item.name}`);
    }

    // Create some variants for popular items
    // Get burger ID
    const burgerResult = await client.query(
      `SELECT id FROM menu_items WHERE name = 'Classic Burger'`
    );
    if (burgerResult.rows.length > 0) {
      const burgerId = burgerResult.rows[0].id;

      // Size variant
      const sizeVariantResult = await client.query(
        `INSERT INTO item_variants (menu_item_id, name, type, is_required, display_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [burgerId, 'Size', 'single_select', true, 1]
      );
      const sizeVariantId = sizeVariantResult.rows[0].id;

      // Size options
      await client.query(
        `INSERT INTO variant_options (variant_id, name, price_modifier, is_default, display_order)
        VALUES 
          ($1, 'Regular', 0.00, true, 1),
          ($1, 'Large', 3.00, false, 2),
          ($1, 'Extra Large', 5.00, false, 3)`,
        [sizeVariantId]
      );

      // Extras variant
      const extrasVariantResult = await client.query(
        `INSERT INTO item_variants (menu_item_id, name, type, is_required, display_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [burgerId, 'Add-ons', 'multi_select', false, 2]
      );
      const extrasVariantId = extrasVariantResult.rows[0].id;

      // Extras options
      await client.query(
        `INSERT INTO variant_options (variant_id, name, price_modifier, display_order)
        VALUES 
          ($1, 'Extra Cheese', 1.50, 1),
          ($1, 'Bacon', 2.00, 2),
          ($1, 'Avocado', 2.50, 3),
          ($1, 'Fried Egg', 1.50, 4)`,
        [extrasVariantId]
      );

      console.log('✓ Created variants for Classic Burger');
    }

    // Create variants for Pizza
    const pizzaResult = await client.query(
      `SELECT id FROM menu_items WHERE name = 'Margherita Pizza'`
    );
    if (pizzaResult.rows.length > 0) {
      const pizzaId = pizzaResult.rows[0].id;

      // Size variant
      const sizeVariantResult = await client.query(
        `INSERT INTO item_variants (menu_item_id, name, type, is_required, display_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [pizzaId, 'Size', 'single_select', true, 1]
      );
      const sizeVariantId = sizeVariantResult.rows[0].id;

      await client.query(
        `INSERT INTO variant_options (variant_id, name, price_modifier, is_default, display_order)
        VALUES 
          ($1, '10 inch', 0.00, true, 1),
          ($1, '12 inch', 4.00, false, 2),
          ($1, '14 inch', 7.00, false, 3)`,
        [sizeVariantId]
      );

      console.log('✓ Created variants for Margherita Pizza');
    }

    // Create variants for Coffee
    const coffeeResult = await client.query(
      `SELECT id FROM menu_items WHERE name = 'Coffee'`
    );
    if (coffeeResult.rows.length > 0) {
      const coffeeId = coffeeResult.rows[0].id;

      // Size variant
      const sizeVariantResult = await client.query(
        `INSERT INTO item_variants (menu_item_id, name, type, is_required, display_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`,
        [coffeeId, 'Size', 'single_select', true, 1]
      );
      const sizeVariantId = sizeVariantResult.rows[0].id;

      await client.query(
        `INSERT INTO variant_options (variant_id, name, price_modifier, is_default, display_order)
        VALUES 
          ($1, 'Small', 0.00, true, 1),
          ($1, 'Medium', 0.50, false, 2),
          ($1, 'Large', 1.00, false, 3)`,
        [sizeVariantId]
      );

      console.log('✓ Created variants for Coffee');
    }

    await client.query('COMMIT');

    console.log('\n✅ Menu data seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - 1 Restaurant created`);
    console.log(`   - ${categories.length} Categories created`);
    console.log(`   - ${menuItems.length} Menu items created`);
    console.log(`   - Variants created for popular items`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding menu data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run the seed directly
if (require.main === module) {
  seedMenuData()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed menu data:', error);
      process.exit(1);
    });
}
