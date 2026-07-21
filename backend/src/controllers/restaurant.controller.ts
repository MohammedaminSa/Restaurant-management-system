import { Response } from 'express';
import { Request } from 'express';
import { AuthRequest } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';

export const getRestaurantPublic = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT id, name, slug, description, logo_url, currency, tax_rate, service_charge_rate
     FROM restaurants WHERE is_active = true ORDER BY created_at ASC LIMIT 1`
  );
  if (result.rows.length === 0) {
    return res.status(200).json({ success: true, data: null });
  }
  return ResponseHandler.success(res, result.rows[0]);
});

export const getRestaurants = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, status } = req.query;

  let queryText = `
    SELECT 
      r.id, r.name, r.slug, r.description, r.logo_url, r.address,
      r.phone, r.email, r.timezone, r.currency, r.is_active,
      r.tax_rate, r.service_charge_rate, r.created_at, r.updated_at,
      (SELECT COUNT(*) FROM users u WHERE u.restaurant_id = r.id AND u.role = 'restaurant_admin') as admin_count
    FROM restaurants r
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (search) {
    queryText += ` AND (r.name ILIKE $${paramCount} OR r.address ILIKE $${paramCount} OR r.email ILIKE $${paramCount})`;
    params.push(`%${search}%`);
    paramCount++;
  }

  if (status === 'active') {
    queryText += ` AND r.is_active = true`;
  } else if (status === 'inactive') {
    queryText += ` AND r.is_active = false`;
  }

  queryText += ` ORDER BY r.created_at DESC`;

  const result = await query(queryText, params);
  return ResponseHandler.success(res, result.rows);
});

export const getRestaurantById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      r.*,
      (SELECT json_agg(json_build_object(
        'id', u.id, 'name', u.name, 'email', u.email, 'role', u.role, 'is_active', u.is_active
      )) FROM users u WHERE u.restaurant_id = r.id AND u.role = 'restaurant_admin') as admins,
      (SELECT COUNT(*) FROM users u WHERE u.restaurant_id = r.id) as total_staff
    FROM restaurants r
    WHERE r.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Restaurant not found', 404);
  }

  return ResponseHandler.success(res, result.rows[0]);
});

export const createRestaurant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, address, phone, email, timezone, currency, tax_rate, service_charge_rate, logo_url, payment_details } = req.body;

  if (!name) {
    throw new AppError('Restaurant name is required', 400);
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'restaurant';

  const result = await query(
    `INSERT INTO restaurants 
      (name, slug, description, address, phone, email, timezone, currency, tax_rate, service_charge_rate, logo_url, payment_details)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      name,
      slug,
      description || null,
      address || null,
      phone || null,
      email || null,
      timezone || 'UTC',
      currency || 'USD',
      tax_rate || 0,
      service_charge_rate || 0,
      logo_url || null,
      payment_details || {},
    ]
  );

  return ResponseHandler.created(res, result.rows[0], 'Restaurant created successfully');
});

export const updateRestaurant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, address, phone, email, timezone, currency, tax_rate, service_charge_rate, is_active, logo_url, payment_details } = req.body;

  const checkResult = await query('SELECT id FROM restaurants WHERE id = $1', [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError('Restaurant not found', 404);
  }

  const result = await query(
    `UPDATE restaurants
    SET 
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      address = COALESCE($3, address),
      phone = COALESCE($4, phone),
      email = COALESCE($5, email),
      timezone = COALESCE($6, timezone),
      currency = COALESCE($7, currency),
      tax_rate = COALESCE($8, tax_rate),
      service_charge_rate = COALESCE($9, service_charge_rate),
      logo_url = COALESCE($10, logo_url),
      is_active = COALESCE($11, is_active),
      payment_details = CASE WHEN $12::jsonb IS NOT NULL THEN $12::jsonb ELSE payment_details END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $13
    RETURNING *`,
    [name, description, address, phone, email, timezone, currency, tax_rate, service_charge_rate, logo_url || null, is_active, payment_details || null, id]
  );

  return ResponseHandler.success(res, result.rows[0], 'Restaurant updated successfully');
});

// Get own restaurant info (any authenticated staff)
export const getMyRestaurant = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.restaurantId) {
    throw new AppError('You are not assigned to a restaurant', 403);
  }

  const result = await query(
    `SELECT id, name, slug, currency, timezone, payment_details
     FROM restaurants WHERE id = $1`,
    [req.user.restaurantId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Restaurant not found', 404);
  }

  return ResponseHandler.success(res, result.rows[0]);
});

// Update own restaurant settings (restaurant_admin)
export const updateMyRestaurant = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.restaurantId) {
    throw new AppError('You are not assigned to a restaurant', 403);
  }

  const { payment_details } = req.body;

  const result = await query(
    `UPDATE restaurants
     SET payment_details = $1::jsonb, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, name, slug, currency, timezone, payment_details`,
    [payment_details || {}, req.user.restaurantId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Restaurant not found', 404);
  }

  return ResponseHandler.success(res, result.rows[0], 'Settings updated successfully');
});

export const deleteRestaurant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const checkResult = await query('SELECT id FROM restaurants WHERE id = $1', [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError('Restaurant not found', 404);
  }

  await query('DELETE FROM restaurants WHERE id = $1', [id]);
  return ResponseHandler.success(res, null, 'Restaurant deleted successfully');
});

export const toggleRestaurantStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const checkResult = await query('SELECT id, is_active FROM restaurants WHERE id = $1', [id]);
  if (checkResult.rows.length === 0) {
    throw new AppError('Restaurant not found', 404);
  }

  const restaurant = checkResult.rows[0];
  const newStatus = !restaurant.is_active;

  const result = await query(
    `UPDATE restaurants SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, is_active`,
    [newStatus, id]
  );

  return ResponseHandler.success(res, result.rows[0], `Restaurant ${newStatus ? 'activated' : 'deactivated'} successfully`);
});
