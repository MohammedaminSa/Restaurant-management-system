import { Response } from 'express';
import { AuthRequest } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// Get all tables
export const getTables = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { restaurantId, status } = req.query;

  let queryText = `
    SELECT 
      id, restaurant_id, table_number, qr_code, capacity, 
      location, status, current_session_id, created_at, updated_at
    FROM tables
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  if (restaurantId) {
    queryText += ` AND restaurant_id = $${paramCount}`;
    params.push(restaurantId);
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

  return ResponseHandler.success(res, result.rows[0]);
});

// Create new table
export const createTable = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { restaurant_id, table_number, capacity, location } = req.body;

  // Validate required fields
  if (!restaurant_id || !table_number || !capacity) {
    throw new AppError('Restaurant ID, table number, and capacity are required', 400);
  }

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

  // Check if table exists
  const checkResult = await query('SELECT id FROM tables WHERE id = $1', [id]);

  if (checkResult.rows.length === 0) {
    throw new AppError('Table not found', 404);
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

  // Check if table has an active session
  const tableCheck = await query(
    `SELECT current_session_id FROM tables WHERE id = $1`,
    [id]
  );

  if (tableCheck.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  if (tableCheck.rows[0].current_session_id) {
    throw new AppError('Cannot delete table with active session', 400);
  }

  await query('DELETE FROM tables WHERE id = $1', [id]);

  return ResponseHandler.success(res, null, 'Table deleted successfully');
});

// Generate QR code image
export const generateQRCode = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get table details
  const result = await query(
    'SELECT id, table_number, qr_code, restaurant_id FROM tables WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  const table = result.rows[0];
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
      t.id, t.restaurant_id, t.table_number, t.capacity, t.location, t.status,
      r.name as restaurant_name, r.logo_url as restaurant_logo,
      r.tax_rate, r.service_charge_rate
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

  return ResponseHandler.success(res, table);
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

  const result = await query(
    `UPDATE tables
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING id, table_number, status`,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Table not found', 404);
  }

  return ResponseHandler.success(res, result.rows[0], 'Table status updated successfully');
});
