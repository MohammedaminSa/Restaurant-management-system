import { Response } from 'express';
import { AuthRequest } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// Create new session when QR code is scanned
export const createSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { table_id, customer_name, customer_phone } = req.body;

  if (!table_id) {
    throw new AppError('Table ID is required', 400);
  }

  // Get table details
  const tableResult = await query(
    `SELECT id, restaurant_id, status, current_session_id 
     FROM tables 
     WHERE id = $1`,
    [table_id]
  );

  if (tableResult.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  const table = tableResult.rows[0];

  // Check if table is available
  if (table.status === 'maintenance') {
    throw new AppError('This table is currently under maintenance', 400);
  }

  if (table.current_session_id) {
    throw new AppError('Table already has an active session', 400);
  }

  // Check if restaurant is active
  const restaurantCheck = await query('SELECT is_active FROM restaurants WHERE id = $1', [table.restaurant_id]);
  if (restaurantCheck.rows.length === 0 || !restaurantCheck.rows[0].is_active) {
    throw new AppError('Restaurant is currently inactive. Cannot start a new session.', 503);
  }

  // Generate unique session token
  const sessionToken = uuidv4();

  // Create session
  const sessionResult = await query(
    `INSERT INTO order_sessions 
      (restaurant_id, table_id, session_token, customer_name, customer_phone, status, started_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    RETURNING *`,
    [table.restaurant_id, table_id, sessionToken, customer_name || null, customer_phone || null, 'active']
  );

  const session = sessionResult.rows[0];

  // Get restaurant payment_details for the customer
  const restaurantResult = await query(
    `SELECT payment_details, currency FROM restaurants WHERE id = $1`,
    [table.restaurant_id]
  );
  const restaurant = restaurantResult.rows[0];

  // Update table status to 'occupied' and link to session
  await query(
    `UPDATE tables 
     SET status = $1, current_session_id = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    ['occupied', session.id, table_id]
  );

  return ResponseHandler.created(res, {
    session_id: session.id,
    session_token: session.session_token,
    table_id: session.table_id,
    restaurant_id: session.restaurant_id,
    customer_name: session.customer_name,
    status: session.status,
    started_at: session.started_at,
    payment_details: restaurant.payment_details,
    currency: restaurant.currency,
  }, 'Session created successfully');
});

// Get active session by token
export const getSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  const result = await query(
    `SELECT 
      os.id, os.restaurant_id, os.table_id, os.session_token, 
      os.customer_name, os.customer_phone, os.status, 
      os.started_at, os.completed_at,
      t.table_number, t.capacity, t.location,
      r.name as restaurant_name, r.logo_url as restaurant_logo,
      r.tax_rate, r.service_charge_rate, r.currency, r.payment_details
    FROM order_sessions os
    JOIN tables t ON os.table_id = t.id
    JOIN restaurants r ON os.restaurant_id = r.id
    WHERE os.session_token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Session not found', 404);
  }

  const session = result.rows[0];

  // Get orders for this session
  const ordersResult = await query(
    `SELECT id, order_number, status, subtotal, tax_amount, 
            service_charge, discount_amount, total_amount,
            payment_method, payment_status, created_at
     FROM orders
     WHERE session_id = $1
     ORDER BY created_at DESC`,
    [session.id]
  );

  return ResponseHandler.success(res, {
    ...session,
    orders: ordersResult.rows,
  });
});

// Complete session (close the dining experience)
export const completeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  // Get session details
  const sessionResult = await query(
    `SELECT id, table_id, status 
     FROM order_sessions 
     WHERE session_token = $1`,
    [token]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Session not found', 404);
  }

  const session = sessionResult.rows[0];

  if (session.status !== 'active') {
    throw new AppError('Session is not active', 400);
  }

  // Update session to completed
  await query(
    `UPDATE order_sessions 
     SET status = $1, completed_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    ['completed', session.id]
  );

  // Update table status back to 'available' and clear current_session_id
  await query(
    `UPDATE tables 
     SET status = $1, current_session_id = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    ['available', session.table_id]
  );

  return ResponseHandler.success(res, null, 'Session completed successfully');
});
