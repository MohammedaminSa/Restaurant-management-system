import { Response } from 'express';
import { AuthRequest, UserRole } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';
import { v4 as uuidv4 } from 'uuid';

// Get waiter's assigned tables
export const getWaiterTables = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  const result = await query(
    `SELECT 
      t.id, t.table_number, t.capacity, t.location, t.status,
      t.current_session_id, t.created_at, t.updated_at,
      os.session_token, os.customer_name, os.started_at
    FROM tables t
    LEFT JOIN order_sessions os ON t.current_session_id = os.id AND os.status = 'active'
    WHERE t.restaurant_id = $1
    ORDER BY t.table_number ASC`,
    [restaurantId]
  );

  return ResponseHandler.success(res, result.rows);
});

// Get active orders for waiter
export const getWaiterOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;

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
      o.id, o.order_number, o.status, o.order_type, o.subtotal,
      o.tax_amount, o.service_charge, o.total_amount, 
      o.special_instructions, o.created_at, o.confirmed_at,
      os.session_token, os.customer_name,
      t.table_number, t.location
    FROM orders o
    JOIN order_sessions os ON o.session_id = os.id
    JOIN tables t ON os.table_id = t.id
    WHERE o.restaurant_id = $1
  `;
  const params: any[] = [restaurantId];

  if (status) {
    queryText += ` AND o.status = $2`;
    params.push(status);
  } else {
    // Default: show active orders (not served or cancelled)
    queryText += ` AND o.status NOT IN ('served', 'cancelled')`;
  }

  queryText += ` ORDER BY o.created_at DESC`;

  const ordersResult = await query(queryText, params);

  // Get items for each order
  const ordersWithItems = await Promise.all(
    ordersResult.rows.map(async (order) => {
      const itemsResult = await query(
        `SELECT 
          oi.id, oi.quantity, oi.unit_price, oi.selected_variants,
          oi.special_instructions, oi.status, oi.total_price,
          mi.name as item_name, mi.image_url
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = $1`,
        [order.id]
      );

      return {
        ...order,
        items: itemsResult.rows,
      };
    })
  );

  return ResponseHandler.success(res, ordersWithItems);
});

// Place order on behalf of customer (waiter-assisted ordering)
export const createWaiterOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { session_token, table_id, items, special_instructions, customer_name, customer_phone, payment_method, transaction_id, payment_account } = req.body;

  if (!items || items.length === 0) {
    throw new AppError('Items are required', 400);
  }

  // Helper to create a new session for a table
  const createNewSession = async (tableId: string, custName?: string, custPhone?: string) => {
    const tableResult = await query(
      `SELECT id, restaurant_id, status, current_session_id 
       FROM tables WHERE id = $1`,
      [tableId]
    );
    if (tableResult.rows.length === 0) {
      throw new AppError('Table not found', 404);
    }
    const table = tableResult.rows[0];
    if (table.status === 'maintenance') {
      throw new AppError('This table is under maintenance', 400);
    }
    if (table.current_session_id) {
      throw new AppError('Table already has an active session', 400);
    }
    const restaurantCheck = await query('SELECT is_active, tax_rate, service_charge_rate FROM restaurants WHERE id = $1', [table.restaurant_id]);
    if (restaurantCheck.rows.length === 0 || !restaurantCheck.rows[0].is_active) {
      throw new AppError('Restaurant is currently inactive', 503);
    }
    const restaurant = restaurantCheck.rows[0];
    const newToken = uuidv4();
    const sessionResult = await query(
      `INSERT INTO order_sessions 
        (restaurant_id, table_id, session_token, customer_name, customer_phone, status, started_at)
      VALUES ($1, $2, $3, $4, $5, 'active', CURRENT_TIMESTAMP)
      RETURNING id, restaurant_id`,
      [table.restaurant_id, tableId, newToken, custName || null, custPhone || null]
    );
    const s = sessionResult.rows[0];
    s.tax_rate = restaurant.tax_rate;
    s.service_charge_rate = restaurant.service_charge_rate;
    await query(
      `UPDATE tables SET status = 'occupied', current_session_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [s.id, tableId]
    );
    return s;
  };

  // Resolve session: use existing active session, or auto-create one from table_id
  let session;
  if (session_token) {
    const sessionResult = await query(
      `SELECT os.id, os.restaurant_id, os.table_id, os.status, r.tax_rate, r.service_charge_rate
       FROM order_sessions os
       JOIN restaurants r ON os.restaurant_id = r.id
       WHERE os.session_token = $1`,
      [session_token]
    );
    if (sessionResult.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }
    session = sessionResult.rows[0];
    if (session.status !== 'active') {
      // Session expired — auto-create a new session for the same table
      session = await createNewSession(session.table_id, customer_name, customer_phone);
    }
  } else if (table_id) {
    session = await createNewSession(table_id, customer_name, customer_phone);
  } else {
    throw new AppError('Either session_token or table_id is required', 400);
  }

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (session.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot create orders for other restaurants', 403);
    }
  }

  // Validate and fetch menu items
  const menuItemIds = items.map((item: any) => item.menu_item_id);
  const menuItemsResult = await query(
    `SELECT id, name, base_price, is_available 
     FROM menu_items 
     WHERE id = ANY($1::uuid[])`,
    [menuItemIds]
  );

  if (menuItemsResult.rows.length !== menuItemIds.length) {
    throw new AppError('Some menu items not found', 404);
  }

  const unavailableItems = menuItemsResult.rows.filter((item) => !item.is_available);
  if (unavailableItems.length > 0) {
    throw new AppError(
      `Some items are currently unavailable: ${unavailableItems.map((i) => i.name).join(', ')}`,
      400
    );
  }

  const menuItemsMap = new Map(menuItemsResult.rows.map((item) => [item.id, item]));

  // Calculate subtotal
  let subtotal = 0;
  const orderItems = items.map((item: any) => {
    const menuItem = menuItemsMap.get(item.menu_item_id);
    if (!menuItem) {
      throw new AppError(`Menu item ${item.menu_item_id} not found`, 404);
    }

    const quantity = item.quantity || 1;
    const unit_price = menuItem.base_price;
    const total_price = unit_price * quantity;
    subtotal += total_price;

    return {
      menu_item_id: item.menu_item_id,
      quantity,
      unit_price,
      selected_variants: item.selected_variants || null,
      special_instructions: item.special_instructions || null,
      total_price,
    };
  });

  // Calculate tax and service charge
  const taxAmount = subtotal * (session.tax_rate / 100);
  const serviceCharge = subtotal * (session.service_charge_rate / 100);
  const totalAmount = subtotal + taxAmount + serviceCharge;

  // Generate unique order number
  const orderNumberResult = await query(
    `SELECT COALESCE(MAX(order_number), 0) + 1 as next_order_number
     FROM orders
     WHERE restaurant_id = $1`,
    [session.restaurant_id]
  );
  const orderNumber = orderNumberResult.rows[0].next_order_number;

  // Determine payment status and order status
  const isDigitalPayment = payment_method && payment_method !== 'cash';
  const orderStatus = 'awaiting_payment';

  // Create order (placed by waiter)
  const orderResult = await query(
    `INSERT INTO orders 
      (restaurant_id, session_id, order_number, status, order_type, 
       subtotal, tax_amount, service_charge, discount_amount, total_amount, 
       special_instructions, payment_method, payment_status, transaction_id, payment_account,
       created_by_user_id, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
    RETURNING *`,
    [
      session.restaurant_id,
      session.id,
      orderNumber,
      orderStatus,
      'dine_in',
      subtotal,
      taxAmount,
      serviceCharge,
      0,
      totalAmount,
      special_instructions || null,
      payment_method || null,
      'unpaid',
      isDigitalPayment ? (transaction_id || null) : null,
      isDigitalPayment && payment_account ? JSON.stringify(payment_account) : null,
      req.user?.id || null,
    ]
  );

  const order = orderResult.rows[0];

  // For non-cash, create payment record with 'pending' status (awaiting cashier approval)
  if (isDigitalPayment) {
    await query(
      `INSERT INTO payments 
        (restaurant_id, session_id, order_id, amount, payment_method, status, transaction_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [session.restaurant_id, session.id, order.id, totalAmount, payment_method, 'pending', transaction_id || null]
    );
  }

  // Insert order items
  for (const item of orderItems) {
    await query(
      `INSERT INTO order_items 
        (order_id, menu_item_id, quantity, unit_price, selected_variants, 
         special_instructions, status, total_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        order.id,
        item.menu_item_id,
        item.quantity,
        item.unit_price,
        item.selected_variants ? JSON.stringify(item.selected_variants) : null,
        item.special_instructions,
        'pending',
        item.total_price,
      ]
    );
  }

  return ResponseHandler.created(res, {
    order_id: order.id,
    order_number: order.order_number,
    status: order.status,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    service_charge: order.service_charge,
    total_amount: order.total_amount,
    created_at: order.created_at,
  }, 'Order placed successfully by waiter');
});

// Mark order as served
export const markOrderServed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get order with restaurant_id for access control
  const orderCheck = await query(
    'SELECT id, restaurant_id, status FROM orders WHERE id = $1',
    [id]
  );

  if (orderCheck.rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderCheck.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (order.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot update orders from other restaurants', 403);
    }
  }

  // Can only mark ready orders as served
  if (order.status !== 'ready') {
    throw new AppError('Order must be ready before it can be served', 400);
  }

  // Update order to served
  const result = await query(
    `UPDATE orders
     SET status = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, order_number, status, completed_at`,
    ['served', id]
  );

  // Update all order items to served
  await query(
    `UPDATE order_items
     SET status = $1
     WHERE order_id = $2`,
    ['served', id]
  );

  return ResponseHandler.success(res, result.rows[0], 'Order marked as served');
});
