import { Response } from 'express';
import { AuthRequest } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';

// Submit customer order
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { session_token, items, special_instructions, payment_method, transaction_id, payment_account } = req.body;

  if (!session_token || !items || items.length === 0) {
    throw new AppError('Session token and items are required', 400);
  }

  if (payment_method) {
    const validMethods = ['cash', 'card', 'digital_wallet', 'online', 'telebirr', 'bank_transfer'];
    if (!validMethods.includes(payment_method)) {
      throw new AppError('Invalid payment method', 400);
    }
  }

  // Get session details
  const sessionResult = await query(
    `SELECT os.id, os.restaurant_id, os.status, r.tax_rate, r.service_charge_rate
     FROM order_sessions os
     JOIN restaurants r ON os.restaurant_id = r.id
     WHERE os.session_token = $1`,
    [session_token]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Session not found', 404);
  }

  const session = sessionResult.rows[0];

  if (session.status !== 'active') {
    throw new AppError('Session is not active', 400);
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

  // Check if all items are available
  const unavailableItems = menuItemsResult.rows.filter((item) => !item.is_available);
  if (unavailableItems.length > 0) {
    throw new AppError(
      `Some items are currently unavailable: ${unavailableItems.map((i) => i.name).join(', ')}`,
      400
    );
  }

  // Create a map for quick lookup
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

  // Determine payment status
  const isPaid = payment_method && payment_method !== 'cash';
  const paymentStatus = isPaid ? 'unpaid' : (payment_method === 'cash' ? 'unpaid' : 'unpaid');

  // Generate unique order number (per restaurant)
  const orderNumberResult = await query(
    `SELECT COALESCE(MAX(order_number), 0) + 1 as next_order_number
     FROM orders
     WHERE restaurant_id = $1`,
    [session.restaurant_id]
  );
  const orderNumber = orderNumberResult.rows[0].next_order_number;

  // Create order
  const orderResult = await query(
    `INSERT INTO orders 
      (restaurant_id, session_id, order_number, status, order_type, 
       subtotal, tax_amount, service_charge, discount_amount, total_amount, 
       special_instructions, payment_method, payment_status, transaction_id, payment_account, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
    RETURNING *`,
    [
      session.restaurant_id,
      session.id,
      orderNumber,
      'awaiting_payment',
      'dine_in',
      subtotal,
      taxAmount,
      serviceCharge,
      0, // discount_amount
      totalAmount,
      special_instructions || null,
      payment_method || null,
      paymentStatus,
      isPaid ? (transaction_id || null) : null,
      isPaid && payment_account ? JSON.stringify(payment_account) : null,
    ]
  );

  const order = orderResult.rows[0];

  // For non-cash, create payment record with 'pending' status (awaiting cashier approval)
  if (isPaid) {
    await query(
      `INSERT INTO payments 
        (restaurant_id, session_id, amount, payment_method, status, transaction_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [session.restaurant_id, session.id, totalAmount, payment_method, 'pending', transaction_id || null]
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

  // Query order items with menu item details to include in response
  const orderItemsResult = await query(
    `SELECT oi.id, oi.order_id, oi.menu_item_id, oi.quantity, oi.unit_price, 
            oi.selected_variants, oi.special_instructions, oi.status, oi.total_price,
            mi.name as menu_item_name
     FROM order_items oi
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [order.id]
  );

  return ResponseHandler.created(res, {
    id: order.id,
    order_number: order.order_number,
    restaurant_id: order.restaurant_id,
    session_id: order.session_id,
    status: order.status,
    order_type: order.order_type,
    subtotal: order.subtotal,
    tax_amount: order.tax_amount,
    service_charge: order.service_charge,
    discount_amount: order.discount_amount,
    total_amount: order.total_amount,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    transaction_id: order.transaction_id,
    payment_account: order.payment_account,
    special_instructions: order.special_instructions,
    created_at: order.created_at,
    items: orderItemsResult.rows,
  }, 'Order placed successfully');
});

// Get order details by ID
export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const orderResult = await query(
    `SELECT o.id, o.order_number, o.status, o.order_type, o.subtotal, 
            o.tax_amount, o.service_charge, o.discount_amount, o.total_amount,
            o.payment_method, o.payment_status,
            o.special_instructions, o.created_at, o.confirmed_at, o.completed_at,
            os.session_token, os.customer_name
     FROM orders o
     JOIN order_sessions os ON o.session_id = os.id
     WHERE o.id = $1`,
    [id]
  );

  if (orderResult.rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = orderResult.rows[0];

  // Get order items with menu item details
  const itemsResult = await query(
    `SELECT oi.id, oi.quantity, oi.unit_price, oi.selected_variants,
            oi.special_instructions, oi.status, oi.total_price,
            mi.name as item_name, mi.image_url, mi.description
     FROM order_items oi
     JOIN menu_items mi ON oi.menu_item_id = mi.id
     WHERE oi.order_id = $1`,
    [id]
  );

  return ResponseHandler.success(res, {
    ...order,
    items: itemsResult.rows,
  });
});

// Get all orders for a session
export const getSessionOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  // Get session
  const sessionResult = await query(
    `SELECT id FROM order_sessions WHERE session_token = $1`,
    [token]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Session not found', 404);
  }

  const session = sessionResult.rows[0];

  // Get orders
  const ordersResult = await query(
    `SELECT o.id, o.order_number, o.status, o.order_type, o.subtotal,
            o.tax_amount, o.service_charge, o.discount_amount, o.total_amount,
            o.payment_method, o.payment_status,
            o.special_instructions, o.created_at, o.confirmed_at, o.completed_at
     FROM orders o
     WHERE o.session_id = $1 AND o.status != 'awaiting_payment'
     ORDER BY o.created_at DESC`,
    [session.id]
  );

  // Get items for each order
  const ordersWithItems = await Promise.all(
    ordersResult.rows.map(async (order) => {
      const itemsResult = await query(
        `SELECT oi.id, oi.quantity, oi.unit_price, oi.selected_variants,
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

// Update order status
export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  // Build dynamic update query based on status
  let updateFields = 'status = $1, updated_at = CURRENT_TIMESTAMP';
  const params: any[] = [status, id];

  if (status === 'confirmed') {
    updateFields += ', confirmed_at = CURRENT_TIMESTAMP';
  } else if (status === 'served') {
    updateFields += ', completed_at = CURRENT_TIMESTAMP';
  }

  const result = await query(
    `UPDATE orders
     SET ${updateFields}
     WHERE id = $2
     RETURNING id, order_number, status, confirmed_at, completed_at`,
    params
  );

  if (result.rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  return ResponseHandler.success(res, result.rows[0], 'Order status updated successfully');
});
