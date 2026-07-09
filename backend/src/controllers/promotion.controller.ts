import { Response } from 'express';
import { AuthRequest, UserRole } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';

// Get all promotions
export const getPromotions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { active } = req.query;

  // Restaurant access control
  let restaurantId: string;
  
  if (req.user?.role === UserRole.SUPER_ADMIN) {
    if (!req.query.restaurantId) {
      throw new AppError('Restaurant ID is required for super admin', 400);
    }
    restaurantId = req.query.restaurantId as string;
  } else {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    restaurantId = req.user.restaurantId;
  }

  let queryText = `
    SELECT 
      id, restaurant_id, name, description, discount_type, discount_value,
      minimum_order_amount, applicable_items, start_date, end_date,
      is_active, usage_limit, usage_count, created_at, updated_at
    FROM promotions
    WHERE restaurant_id = $1
  `;

  if (active === 'true') {
    queryText += ` AND is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`;
  }

  queryText += ` ORDER BY created_at DESC`;

  const result = await query(queryText, [restaurantId]);

  return ResponseHandler.success(res, result.rows);
});

// Get single promotion
export const getPromotion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      id, restaurant_id, name, description, discount_type, discount_value,
      minimum_order_amount, applicable_items, start_date, end_date,
      is_active, usage_limit, usage_count, created_at, updated_at
    FROM promotions
    WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Promotion not found', 404);
  }

  const promotion = result.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (promotion.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot access promotions from other restaurants', 403);
    }
  }

  return ResponseHandler.success(res, promotion);
});

// Create promotion
export const createPromotion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    restaurant_id,
    name,
    description,
    discount_type,
    discount_value,
    minimum_order_amount,
    applicable_items,
    start_date,
    end_date,
    usage_limit
  } = req.body;

  if (!restaurant_id || !name || !discount_type || discount_value === undefined || !start_date || !end_date) {
    throw new AppError('Restaurant ID, name, discount type, discount value, start date, and end date are required', 400);
  }

  // Validate discount type
  const validTypes = ['percentage', 'fixed_amount'];
  if (!validTypes.includes(discount_type)) {
    throw new AppError('Invalid discount type. Must be percentage or fixed_amount', 400);
  }

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot create promotions for other restaurants', 403);
    }
  }

  const result = await query(
    `INSERT INTO promotions
      (restaurant_id, name, description, discount_type, discount_value,
       minimum_order_amount, applicable_items, start_date, end_date,
       is_active, usage_limit, usage_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      restaurant_id,
      name,
      description || null,
      discount_type,
      discount_value,
      minimum_order_amount || 0,
      applicable_items ? JSON.stringify(applicable_items) : null,
      start_date,
      end_date,
      true,
      usage_limit || null,
      0
    ]
  );

  return ResponseHandler.created(res, result.rows[0], 'Promotion created successfully');
});

// Update promotion
export const updatePromotion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    name,
    description,
    discount_type,
    discount_value,
    minimum_order_amount,
    applicable_items,
    start_date,
    end_date,
    is_active,
    usage_limit
  } = req.body;

  // Get promotion to check ownership
  const promoCheck = await query('SELECT id, restaurant_id FROM promotions WHERE id = $1', [id]);

  if (promoCheck.rows.length === 0) {
    throw new AppError('Promotion not found', 404);
  }

  const promotion = promoCheck.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (promotion.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot update promotions from other restaurants', 403);
    }
  }

  // Validate discount type if provided
  if (discount_type && !['percentage', 'fixed_amount'].includes(discount_type)) {
    throw new AppError('Invalid discount type. Must be percentage or fixed_amount', 400);
  }

  const result = await query(
    `UPDATE promotions
    SET 
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      discount_type = COALESCE($3, discount_type),
      discount_value = COALESCE($4, discount_value),
      minimum_order_amount = COALESCE($5, minimum_order_amount),
      applicable_items = COALESCE($6, applicable_items),
      start_date = COALESCE($7, start_date),
      end_date = COALESCE($8, end_date),
      is_active = COALESCE($9, is_active),
      usage_limit = COALESCE($10, usage_limit),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
    RETURNING *`,
    [
      name,
      description,
      discount_type,
      discount_value,
      minimum_order_amount,
      applicable_items ? JSON.stringify(applicable_items) : undefined,
      start_date,
      end_date,
      is_active,
      usage_limit,
      id
    ]
  );

  return ResponseHandler.success(res, result.rows[0], 'Promotion updated successfully');
});

// Delete promotion
export const deletePromotion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get promotion to check ownership
  const promoCheck = await query('SELECT id, restaurant_id FROM promotions WHERE id = $1', [id]);

  if (promoCheck.rows.length === 0) {
    throw new AppError('Promotion not found', 404);
  }

  const promotion = promoCheck.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (promotion.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot delete promotions from other restaurants', 403);
    }
  }

  await query('DELETE FROM promotions WHERE id = $1', [id]);

  return ResponseHandler.success(res, null, 'Promotion deleted successfully');
});
