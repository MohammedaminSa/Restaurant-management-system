import { Response } from 'express';
import { AuthRequest, UserRole } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';

// Get active sessions (sessions with unpaid bills)
export const getActiveSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  // Get active sessions with their orders
  const sessionsResult = await query(
    `SELECT 
      os.id, os.session_token, os.customer_name, os.customer_phone,
      os.status, os.started_at,
      t.table_number, t.location,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_bill,
      COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as paid_amount,
      COUNT(DISTINCT CASE WHEN o.payment_status = 'paid' THEN o.id END) as paid_order_count
    FROM order_sessions os
    JOIN tables t ON os.table_id = t.id
    LEFT JOIN orders o ON os.id = o.session_id AND o.status != 'cancelled'
    WHERE os.restaurant_id = $1 AND os.status = 'active'
    GROUP BY os.id, os.session_token, os.customer_name, os.customer_phone,
             os.status, os.started_at, t.table_number, t.location
    ORDER BY os.started_at DESC`,
    [restaurantId]
  );

  return ResponseHandler.success(res, sessionsResult.rows);
});

// Get session bill (total calculation)
export const getSessionBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  // Get session details
  const sessionResult = await query(
    `SELECT os.id, os.restaurant_id, os.session_token, os.customer_name,
            os.customer_phone, os.status, os.started_at,
            t.table_number, t.location,
            r.name as restaurant_name, r.tax_rate, r.service_charge_rate, r.currency
     FROM order_sessions os
     JOIN tables t ON os.table_id = t.id
     JOIN restaurants r ON os.restaurant_id = r.id
     WHERE os.session_token = $1`,
    [token]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Session not found', 404);
  }

  const session = sessionResult.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (session.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot access sessions from other restaurants', 403);
    }
  }

  // Get all orders for this session
  const ordersResult = await query(
    `SELECT o.id, o.order_number, o.status, o.subtotal, o.tax_amount,
            o.service_charge, o.discount_amount, o.total_amount,
            o.payment_method, o.payment_status, o.created_at
     FROM orders o
     WHERE o.session_id = $1 AND o.status != 'cancelled'
     ORDER BY o.created_at ASC`,
    [session.id]
  );

  // Get items for each order
  const ordersWithItems = await Promise.all(
    ordersResult.rows.map(async (order) => {
      const itemsResult = await query(
        `SELECT oi.id, oi.quantity, oi.unit_price, oi.selected_variants,
                oi.total_price, mi.name as item_name
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

  // Calculate totals
  const bill = ordersResult.rows.reduce(
    (acc, order) => ({
      subtotal: acc.subtotal + parseFloat(order.subtotal),
      tax_amount: acc.tax_amount + parseFloat(order.tax_amount),
      service_charge: acc.service_charge + parseFloat(order.service_charge),
      discount_amount: acc.discount_amount + parseFloat(order.discount_amount),
      total_amount: acc.total_amount + parseFloat(order.total_amount),
    }),
    { subtotal: 0, tax_amount: 0, service_charge: 0, discount_amount: 0, total_amount: 0 }
  );

  return ResponseHandler.success(res, {
    session: {
      session_token: session.session_token,
      customer_name: session.customer_name,
      customer_phone: session.customer_phone,
      table_number: session.table_number,
      location: session.location,
      restaurant_name: session.restaurant_name,
      started_at: session.started_at,
      currency: session.currency,
    },
    orders: ordersWithItems,
    bill: {
      subtotal: bill.subtotal.toFixed(2),
      tax_amount: bill.tax_amount.toFixed(2),
      service_charge: bill.service_charge.toFixed(2),
      discount_amount: bill.discount_amount.toFixed(2),
      total_amount: bill.total_amount.toFixed(2),
      tax_rate: session.tax_rate,
      service_charge_rate: session.service_charge_rate,
    },
  });
});

// Get session orders
export const getSessionOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  // Get session
  const sessionResult = await query(
    `SELECT id, restaurant_id FROM order_sessions WHERE session_token = $1`,
    [token]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Session not found', 404);
  }

  const session = sessionResult.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (session.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot access sessions from other restaurants', 403);
    }
  }

  // Get orders
  const ordersResult = await query(
    `SELECT o.id, o.order_number, o.status, o.order_type, o.subtotal,
            o.tax_amount, o.service_charge, o.discount_amount, o.total_amount,
            o.special_instructions, o.created_at
     FROM orders o
     WHERE o.session_id = $1
     ORDER BY o.created_at DESC`,
    [session.id]
  );

  // Get items for each order
  const ordersWithItems = await Promise.all(
    ordersResult.rows.map(async (order) => {
      const itemsResult = await query(
        `SELECT oi.id, oi.quantity, oi.unit_price, oi.selected_variants,
                oi.special_instructions, oi.status, oi.total_price,
                mi.name as item_name
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

// Record payment
export const recordPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { session_token, amount, payment_method, tip_amount } = req.body;

  if (!session_token || !amount || !payment_method) {
    throw new AppError('Session token, amount, and payment method are required', 400);
  }

  // Validate payment method
  const validMethods = ['cash', 'card', 'digital_wallet', 'online', 'telebirr', 'chapa', 'bank_transfer'];
  if (!validMethods.includes(payment_method)) {
    throw new AppError('Invalid payment method', 400);
  }

  // Get session with table_id
  const sessionResult = await query(
    `SELECT id, restaurant_id, status, table_id FROM order_sessions WHERE session_token = $1`,
    [session_token]
  );

  if (sessionResult.rows.length === 0) {
    throw new AppError('Session not found', 404);
  }

  const session = sessionResult.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (session.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot process payments for other restaurants', 403);
    }
  }

  if (session.status !== 'active') {
    throw new AppError('Session is not active', 400);
  }

  // Calculate total bill to verify amount
  const billResult = await query(
    `SELECT COALESCE(SUM(total_amount), 0) as total
     FROM orders
     WHERE session_id = $1 AND status != 'cancelled'`,
    [session.id]
  );

  const billTotal = parseFloat(billResult.rows[0].total);
  const paymentAmount = parseFloat(amount);
  const tipAmountValue = tip_amount ? parseFloat(tip_amount) : 0;

  // Allow slight variance for rounding
  if (Math.abs(paymentAmount - billTotal) > 0.01 && paymentAmount < billTotal) {
    throw new AppError(`Payment amount (${paymentAmount}) does not match bill total (${billTotal})`, 400);
  }

  // Record payment
  const paymentResult = await query(
    `INSERT INTO payments
      (restaurant_id, session_id, amount, payment_method, status, created_at, completed_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *`,
    [session.restaurant_id, session.id, paymentAmount + tipAmountValue, payment_method, 'completed']
  );

  const payment = paymentResult.rows[0];

  // Complete the session after payment
  await query(
    `UPDATE order_sessions 
     SET status = $1, completed_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    ['completed', session.id]
  );

  // Free the table - Update table status back to 'available' and clear current_session_id
  await query(
    `UPDATE tables 
     SET status = $1, current_session_id = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    ['available', session.table_id]
  );

  return ResponseHandler.created(res, {
    payment_id: payment.id,
    amount: payment.amount,
    payment_method: payment.payment_method,
    status: payment.status,
    tip_amount: tipAmountValue.toFixed(2),
    bill_total: billTotal.toFixed(2),
    created_at: payment.created_at,
  }, 'Payment recorded successfully');
});

// Get payment details
export const getPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT p.id, p.restaurant_id, p.session_id, p.amount, p.payment_method,
            p.status, p.transaction_id, p.created_at, p.completed_at,
            os.session_token, os.customer_name
     FROM payments p
     JOIN order_sessions os ON p.session_id = os.id
     WHERE p.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Payment not found', 404);
  }

  const payment = result.rows[0];

  // Restaurant access control (except super_admin)
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (payment.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot access payments from other restaurants', 403);
    }
  }

  return ResponseHandler.success(res, payment);
});

// Get today's transactions
export const getTodayTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
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

  // Get restaurant timezone for accurate local date filtering
  const restResult = await query('SELECT COALESCE(timezone, \'UTC\') as tz FROM restaurants WHERE id = $1', [restaurantId]);
  const timezone = restResult.rows[0]?.tz || 'UTC';

  const result = await query(
    `SELECT p.id, p.amount, p.payment_method, p.status, p.created_at, p.completed_at,
            os.session_token, os.customer_name,
            t.table_number,
            COALESCE(
              (SELECT STRING_AGG(DISTINCT oi2.item_summary, ', ')
               FROM (
                 SELECT CONCAT(oi.quantity, 'x ', mi.name) AS item_summary, oi.order_id
                 FROM order_items oi
                 JOIN menu_items mi ON oi.menu_item_id = mi.id
                 JOIN orders o ON oi.order_id = o.id
                 WHERE o.session_id = os.id
               ) oi2
              ), ''
            ) as items
     FROM payments p
     JOIN order_sessions os ON p.session_id = os.id
     JOIN tables t ON os.table_id = t.id
     WHERE p.restaurant_id = $1 
       AND (p.created_at AT TIME ZONE 'UTC' AT TIME ZONE $2)::date = (NOW() AT TIME ZONE $2)::date
     ORDER BY p.created_at DESC`,
    [restaurantId, timezone]
  );

  // Calculate summary
  const summary = result.rows.reduce(
    (acc, payment) => {
      const amount = parseFloat(payment.amount);
      acc.total += amount;
      acc.count++;
      acc.by_method[payment.payment_method] = (acc.by_method[payment.payment_method] || 0) + amount;
      return acc;
    },
    { total: 0, count: 0, by_method: {} as Record<string, number> }
  );

  return ResponseHandler.success(res, {
    transactions: result.rows,
    summary: {
      total_amount: summary.total.toFixed(2),
      transaction_count: summary.count,
      by_payment_method: summary.by_method,
    },
  });
});
