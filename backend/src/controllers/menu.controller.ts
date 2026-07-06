import { Response } from 'express';
import { AuthRequest } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';

// Get all categories
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { restaurantId } = req.query;

  let queryText = `
    SELECT 
      id, name, description, image_url, display_order, is_active, 
      parent_category_id, created_at, updated_at
    FROM categories
    WHERE is_active = true
  `;
  const params: any[] = [];

  if (restaurantId) {
    queryText += ` AND restaurant_id = $1`;
    params.push(restaurantId);
  }

  queryText += ` ORDER BY display_order ASC, name ASC`;

  const result = await query(queryText, params);

  return ResponseHandler.success(res, result.rows);
});

// Get all menu items with optional filtering
export const getMenuItems = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    categoryId, 
    search, 
    isAvailable, 
    isFeatured,
    restaurantId,
    page = '1',
    pageSize = '20'
  } = req.query;

  const pageNum = parseInt(page as string);
  const pageSizeNum = parseInt(pageSize as string);
  const offset = (pageNum - 1) * pageSizeNum;

  let queryText = `
    SELECT 
      mi.id, mi.name, mi.description, mi.image_url, mi.base_price,
      mi.preparation_time, mi.is_available, mi.is_featured,
      mi.dietary_info, mi.allergens, mi.display_order,
      mi.category_id, mi.restaurant_id, mi.created_at, mi.updated_at,
      c.name as category_name
    FROM menu_items mi
    LEFT JOIN categories c ON mi.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (restaurantId) {
    queryText += ` AND mi.restaurant_id = $${paramCount}`;
    params.push(restaurantId);
    paramCount++;
  }

  if (categoryId) {
    queryText += ` AND mi.category_id = $${paramCount}`;
    params.push(categoryId);
    paramCount++;
  }

  if (search) {
    queryText += ` AND (mi.name ILIKE $${paramCount} OR mi.description ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  if (isAvailable !== undefined) {
    queryText += ` AND mi.is_available = $${paramCount}`;
    params.push(isAvailable === 'true');
    paramCount++;
  }

  if (isFeatured !== undefined) {
    queryText += ` AND mi.is_featured = $${paramCount}`;
    params.push(isFeatured === 'true');
    paramCount++;
  }

  // Get total count
  const countQuery = queryText.replace(
    /SELECT[\s\S]*FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].total);

  // Add pagination
  queryText += ` ORDER BY mi.display_order ASC, mi.name ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(pageSizeNum, offset);

  const result = await query(queryText, params);

  return ResponseHandler.paginated(res, result.rows, pageNum, pageSizeNum, totalItems);
});

// Get single menu item with variants
export const getMenuItemById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get menu item
  const itemResult = await query(
    `SELECT 
      mi.id, mi.name, mi.description, mi.image_url, mi.base_price,
      mi.preparation_time, mi.is_available, mi.is_featured,
      mi.dietary_info, mi.allergens, mi.nutritional_info,
      mi.display_order, mi.category_id, mi.restaurant_id,
      mi.created_at, mi.updated_at,
      c.name as category_name
    FROM menu_items mi
    LEFT JOIN categories c ON mi.category_id = c.id
    WHERE mi.id = $1`,
    [id]
  );

  if (itemResult.rows.length === 0) {
    throw new AppError('Menu item not found', 404);
  }

  const menuItem = itemResult.rows[0];

  // Get variants with options
  const variantsResult = await query(
    `SELECT 
      iv.id, iv.name, iv.type, iv.is_required, iv.display_order
    FROM item_variants iv
    WHERE iv.menu_item_id = $1
    ORDER BY iv.display_order ASC`,
    [id]
  );

  // Get options for each variant
  const variants = await Promise.all(
    variantsResult.rows.map(async (variant) => {
      const optionsResult = await query(
        `SELECT 
          id, name, price_modifier, is_default, display_order
        FROM variant_options
        WHERE variant_id = $1
        ORDER BY display_order ASC`,
        [variant.id]
      );

      return {
        ...variant,
        options: optionsResult.rows,
      };
    })
  );

  const response = {
    ...menuItem,
    variants,
  };

  return ResponseHandler.success(res, response);
});

// Create menu item (Admin only)
export const createMenuItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    name,
    description,
    image_url,
    base_price,
    preparation_time,
    category_id,
    restaurant_id,
    is_featured,
    dietary_info,
    allergens,
    nutritional_info,
    display_order,
  } = req.body;

  // Validate required fields
  if (!name || !base_price || !category_id || !restaurant_id) {
    throw new AppError('Name, base price, category, and restaurant are required', 400);
  }

  const result = await query(
    `INSERT INTO menu_items 
      (name, description, image_url, base_price, preparation_time, 
       category_id, restaurant_id, is_featured, dietary_info, 
       allergens, nutritional_info, display_order)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      name,
      description || null,
      image_url || null,
      base_price,
      preparation_time || null,
      category_id,
      restaurant_id,
      is_featured || false,
      dietary_info ? JSON.stringify(dietary_info) : null,
      allergens ? JSON.stringify(allergens) : null,
      nutritional_info ? JSON.stringify(nutritional_info) : null,
      display_order || 0,
    ]
  );

  return ResponseHandler.created(res, result.rows[0], 'Menu item created successfully');
});

// Update menu item (Admin only)
export const updateMenuItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    description,
    image_url,
    base_price,
    preparation_time,
    is_available,
    is_featured,
    dietary_info,
    allergens,
    nutritional_info,
    display_order,
  } = req.body;

  // Check if item exists
  const checkResult = await query('SELECT id FROM menu_items WHERE id = $1', [id]);
  
  if (checkResult.rows.length === 0) {
    throw new AppError('Menu item not found', 404);
  }

  const result = await query(
    `UPDATE menu_items
    SET 
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      image_url = COALESCE($3, image_url),
      base_price = COALESCE($4, base_price),
      preparation_time = COALESCE($5, preparation_time),
      is_available = COALESCE($6, is_available),
      is_featured = COALESCE($7, is_featured),
      dietary_info = COALESCE($8, dietary_info),
      allergens = COALESCE($9, allergens),
      nutritional_info = COALESCE($10, nutritional_info),
      display_order = COALESCE($11, display_order),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $12
    RETURNING *`,
    [
      name,
      description,
      image_url,
      base_price,
      preparation_time,
      is_available,
      is_featured,
      dietary_info ? JSON.stringify(dietary_info) : null,
      allergens ? JSON.stringify(allergens) : null,
      nutritional_info ? JSON.stringify(nutritional_info) : null,
      display_order,
      id,
    ]
  );

  return ResponseHandler.success(res, result.rows[0], 'Menu item updated successfully');
});

// Delete menu item (Admin only)
export const deleteMenuItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Menu item not found', 404);
  }

  return ResponseHandler.success(res, null, 'Menu item deleted successfully');
});

// Toggle menu item availability (Admin only)
export const toggleAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `UPDATE menu_items
    SET is_available = NOT is_available, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, name, is_available`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Menu item not found', 404);
  }

  return ResponseHandler.success(
    res,
    result.rows[0],
    `Menu item ${result.rows[0].is_available ? 'enabled' : 'disabled'} successfully`
  );
});
