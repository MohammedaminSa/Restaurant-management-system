import { Response } from 'express';
import { AuthRequest, UserRole } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// Get all tables
export const getTables = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { restaurantId, status } = req.query;

  // Restaurant access control
  let filterRestaurantId: string | undefined;
  
  if (req.user?.role === 'super_admin') {
    // Super admin can see all restaurants
    filterRestaurantId = restaurantId as string | undefined;
  } else {
    // Other users (restaurant_admin, waiter) can only see their own restaurant
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    filterRestaurantId = req.user.restaurantId;
  }

  let queryText = `
    SELECT 
      id, restaurant_id, table_number, qr_code, capacity, 
      location, status, current_session_id, created_at, updated_at
    FROM tables
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (filterRestaurantId) {
    queryText += ` AND restaurant_id = $${paramCount}`;
    params.push(filterRestaurantId);
    paramCount++;
  }

  if (status) {
    queryText += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  queryText += ` ORDER BY table_number ASC`;

  const result = await query(queryText, params);

  return ResponseHandler.success(res, result.rows);
});

// Get single table by ID
export const getTableById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      t.id, t.restaurant_id, t.table_number, t.qr_code, t.capacity,
      t.location, t.status, t.current_session_id, t.created_at, t.updated_at,
      os.session_token, os.customer_name, os.started_at, os.status as session_status
    FROM tables t
    LEFT JOIN order_sessions os ON t.current_session_id = os.id
    WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  const table = result.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== 'super_admin') {
    if (table.restaurant_id !== req.user?.restaurantId) {
      throw new AppError('Forbidden: Cannot access tables from other restaurants', 403);
    }
  }

  return ResponseHandler.success(res, table);
});

// Create new table
export const createTable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { restaurant_id, table_number, capacity, location } = req.body;

  // Validate required fields
  if (!restaurant_id || !table_number || !capacity) {
    throw new AppError('Restaurant ID, table number, and capacity are required', 400);
  }

  // Restaurant access control
  if (req.user?.role !== 'super_admin') {
    // Non-super_admin users can only create tables for their assigned restaurant
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot create tables for other restaurants', 403);
    }
  }
  // Super admin can create tables for any restaurant - no restrictions

  // Check if table number already exists for this restaurant
  const existingTable = await query(
    'SELECT id FROM tables WHERE restaurant_id = $1 AND table_number = $2',
    [restaurant_id, table_number]
  );

  if (existingTable.rows.length > 0) {
    throw new AppError('Table number already exists for this restaurant', 409);
  }

  // Generate unique QR code identifier
  const qrCodeId = uuidv4();
  const qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/scan/${qrCodeId}`;

  // Insert table
  const result = await query(
    `INSERT INTO tables 
      (restaurant_id, table_number, qr_code, capacity, location, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [restaurant_id, table_number, qrCodeId, capacity, location || null, 'available']
  );

  return ResponseHandler.created(res, result.rows[0], 'Table created successfully');
});

// Update table
export const updateTable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { table_number, capacity, location, status } = req.body;

  // Fetch table with restaurant_id to verify it exists and check ownership
  const checkResult = await query(
    'SELECT id, restaurant_id FROM tables WHERE id = $1',
    [id]
  );

  if (checkResult.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  const table = checkResult.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== 'super_admin') {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (table.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot update tables from other restaurants', 403);
    }
  }

  const result = await query(
    `UPDATE tables
    SET 
      table_number = COALESCE($1, table_number),
      capacity = COALESCE($2, capacity),
      location = COALESCE($3, location),
      status = COALESCE($4, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *`,
    [table_number, capacity, location, status, id]
  );

  return ResponseHandler.success(res, result.rows[0], 'Table updated successfully');
});

// Delete table
export const deleteTable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Fetch table with restaurant_id to check ownership and active session
  const tableCheck = await query(
    `SELECT restaurant_id, current_session_id FROM tables WHERE id = $1`,
    [id]
  );

  if (tableCheck.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  const table = tableCheck.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== 'super_admin') {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (table.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot delete tables from other restaurants', 403);
    }
  }

  if (table.current_session_id) {
    throw new AppError('Cannot delete table with active session', 400);
  }

  await query('DELETE FROM tables WHERE id = $1', [id]);

  return ResponseHandler.success(res, null, 'Table deleted successfully');
});

// Generate QR code image
export const generateQRCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get table details with restaurant_id
  const result = await query(
    'SELECT id, table_number, qr_code, restaurant_id FROM tables WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  const table = result.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== 'super_admin') {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (table.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot generate QR codes for other restaurants', 403);
    }
  }

  const qrCodeData = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/scan/${table.qr_code}`;

  try {
    // Generate QR code as data URL
    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return ResponseHandler.success(res, {
      table_id: table.id,
      table_number: table.table_number,
      qr_code: table.qr_code,
      qr_code_url: qrCodeData,
      qr_code_image: qrCodeImage,
    });
  } catch (error) {
    throw new AppError('Failed to generate QR code', 500);
  }
});

// Get table by QR code (for customer scanning)
export const getTableByQRCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { qrCode } = req.params;

  const result = await query(
    `SELECT 
      t.id, t.restaurant_id, t.table_number, t.capacity, t.location, t.status, t.current_session_id,
      r.name as restaurant_name, r.logo_url as restaurant_logo,
      r.tax_rate, r.service_charge_rate, r.currency, r.payment_details
    FROM tables t
    LEFT JOIN restaurants r ON t.restaurant_id = r.id
    WHERE t.qr_code = $1`,
    [qrCode]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid QR code', 404);
  }

  const table = result.rows[0];

  // Check if table is available
  if (table.status === 'maintenance') {
    throw new AppError('This table is currently under maintenance', 400);
  }

  // If table is occupied, get the active session details
  let activeSession = null;
  if (table.current_session_id) {
    const sessionResult = await query(
      `SELECT session_token, customer_name, started_at 
       FROM order_sessions 
       WHERE id = $1 AND status = 'active'`,
      [table.current_session_id]
    );
    
    if (sessionResult.rows.length > 0) {
      activeSession = sessionResult.rows[0];
    }
  }

  return ResponseHandler.success(res, {
    ...table,
    active_session: activeSession,
  });
});

// Update table status
export const updateTableStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  // Fetch table with restaurant_id before updating
  const tableCheck = await query(
    'SELECT id, restaurant_id FROM tables WHERE id = $1',
    [id]
  );

  if (tableCheck.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  const table = tableCheck.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== 'super_admin') {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (table.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot update status of tables from other restaurants', 403);
    }
  }

  const result = await query(
    `UPDATE tables
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, table_number, status`,
    [status, id]
  );

  return ResponseHandler.success(res, result.rows[0], 'Table status updated successfully');
});

// Assign table to a waiter
export const assignWaiterToTable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { waiter_id } = req.body;

  if (!waiter_id) {
    throw new AppError('Waiter ID is required', 400);
  }

  // Verify table exists with restaurant info
  const tableCheck = await query(
    'SELECT id, restaurant_id, assigned_waiter_id FROM tables WHERE id = $1',
    [id]
  );

  if (tableCheck.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  const table = tableCheck.rows[0];

  // Restaurant access control
  if (req.user?.role !== 'super_admin') {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (table.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot assign tables from other restaurants', 403);
    }
  }

  // Verify waiter exists and belongs to same restaurant
  const waiterCheck = await query(
    'SELECT id, role, restaurant_id FROM users WHERE id = $1',
    [waiter_id]
  );

  if (waiterCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const waiter = waiterCheck.rows[0];

  if (waiter.role !== 'waiter') {
    throw new AppError('User must have waiter role', 400);
  }

  if (req.user?.role !== 'super_admin' && waiter.restaurant_id !== table.restaurant_id) {
    throw new AppError('Waiter does not belong to this restaurant', 400);
  }

  const result = await query(
    `UPDATE tables
    SET assigned_waiter_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, table_number, assigned_waiter_id`,
    [waiter_id, id]
  );

  return ResponseHandler.success(res, result.rows[0], 'Table assigned to waiter successfully');
});

// Get tables assigned to current waiter
export const getMyAssignedTables = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('Not authenticated', 401);
  }

  const result = await query(
    `SELECT 
      t.id, t.table_number, t.capacity, t.location, t.status,
      t.current_session_id, t.created_at, t.updated_at,
      os.session_token, os.customer_name, os.started_at
    FROM tables t
    LEFT JOIN order_sessions os ON t.current_session_id = os.id
    WHERE t.assigned_waiter_id = $1
    ORDER BY t.table_number ASC`,
    [req.user.id]
  );

  return ResponseHandler.success(res, result.rows);
});
