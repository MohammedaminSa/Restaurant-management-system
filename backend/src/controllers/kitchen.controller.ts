import { Response } from 'express';
import { AuthRequest, UserRole } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';

// Get kitchen orders (pending/preparing/ready)
export const getKitchenOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;

  // Restaurant access control
  let restaurantId: string;
  
  if (req.user?.role === UserRole.SUPER_ADMIN) {
    // Super admin must specify restaurant
    if (!req.query.restaurantId) {
      throw new AppError('Restaurant ID is required for super admin', 400);
    }
    restaurantId = req.query.restaurantId as string;
  } else {
    // Kitchen staff and other users can only see their own restaurant
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    restaurantId = req.user.restaurantId;
  }

  // Build query
  let queryText = `
    SELECT 
      o.id, o.order_number, o.status, o.order_type, o.subtotal,
      o.tax_amount, o.service_charge, o.total_amount, 
      o.special_instructions, o.created_at, o.confirmed_at,
      o.payment_status,
      os.session_token, os.customer_name,
      t.table_number, t.location
    FROM orders o
    JOIN order_sessions os ON o.session_id = os.id
    JOIN tables t ON os.table_id = t.id
    WHERE o.restaurant_id = $1
  `;
  const params: any[] = [restaurantId];
  let paramCount = 2;

  // Only show orders that have been approved by cashier
  queryText += ` AND o.payment_status = 'paid'`;

  // Filter by status if provided
  if (status) {
    const validStatuses = ['pending', 'preparing', 'ready'];
    if (!validStatuses.includes(status as string)) {
      throw new AppError('Invalid status. Valid values: pending, preparing, ready', 400);
    }
    queryText += ` AND o.status = $${paramCount}`;
    params.push(status);
    paramCount++;
  } else {
    // Default: show only active kitchen orders
    queryText += ` AND o.status IN ('pending', 'preparing', 'ready')`;
  }

  // Order by priority: pending first, then by creation time
  queryText += ` ORDER BY 
    CASE o.status 
      WHEN 'pending' THEN 1 
      WHEN 'preparing' THEN 2 
      WHEN 'ready' THEN 3 
      ELSE 4 
    END,
    o.created_at ASC
  `;

  const ordersResult = await query(queryText, params);

  // Get items for each order
  const ordersWithItems = await Promise.all(
    ordersResult.rows.map(async (order) => {
      const itemsResult = await query(
        `SELECT 
          oi.id, oi.quantity, oi.unit_price, oi.selected_variants,
          oi.special_instructions, oi.status, oi.total_price,
          mi.name as menu_item_name, mi.image_url, mi.preparation_time
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE oi.order_id = $1`,
        [order.id]
      );

      // Calculate estimated preparation time
      const totalPrepTime = itemsResult.rows.reduce(
        (sum, item) => sum + (item.preparation_time || 0) * item.quantity,
        0
      );

      return {
        ...order,
        items: itemsResult.rows,
        estimated_prep_time: totalPrepTime,
      };
    })
  );

  return ResponseHandler.success(res, ordersWithItems);
});

// Update kitchen order status
export const updateKitchenOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  // Kitchen can only update to: preparing, ready
  const validStatuses = ['preparing', 'ready'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status. Kitchen can only set: preparing, ready', 400);
  }

  // Get order with restaurant_id for access control
  const orderCheck = await query(
    'SELECT id, restaurant_id, status as current_status FROM orders WHERE id = $1',
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

  // Validate status transition
  if (order.current_status === 'served' || order.current_status === 'cancelled') {
    throw new AppError('Cannot update completed or cancelled orders', 400);
  }

  // Update order status
  let updateFields = 'status = $1, updated_at = CURRENT_TIMESTAMP';
  const params: any[] = [status, id];

  if (status === 'preparing') {
    updateFields += ', confirmed_at = CURRENT_TIMESTAMP';
  }

  const result = await query(
    `UPDATE orders
     SET ${updateFields}
     WHERE id = $2
     RETURNING id, order_number, status, confirmed_at`,
    params
  );

  // Also update all order items to the same status
  await query(
    `UPDATE order_items
     SET status = $1
     WHERE order_id = $2`,
    [status, id]
  );

  return ResponseHandler.success(res, result.rows[0], 'Order status updated successfully');
});

// Update individual order item status
export const updateOrderItemStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  // Get order item with order and restaurant info for access control
  const itemCheck = await query(
    `SELECT oi.id, o.restaurant_id
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.id = $1`,
    [id]
  );

  if (itemCheck.rows.length === 0) {
    throw new AppError('Order item not found', 404);
  }

  const item = itemCheck.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (item.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot update order items from other restaurants', 403);
    }
  }

  // Update item status
  const result = await query(
    `UPDATE order_items
     SET status = $1
     WHERE id = $2
     RETURNING id, status`,
    [status, id]
  );

  return ResponseHandler.success(res, result.rows[0], 'Order item status updated successfully');
});
