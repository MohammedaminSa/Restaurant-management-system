import { Response } from 'express';
import { AuthRequest, UserRole } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';

// Get all inventory items
export const getInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { lowStock } = req.query;

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
      id, restaurant_id, item_name, unit, current_quantity,
      minimum_quantity, unit_cost, supplier_name, last_restocked_at,
      created_at, updated_at
    FROM inventory
    WHERE restaurant_id = $1
  `;

  if (lowStock === 'true') {
    queryText += ` AND current_quantity <= minimum_quantity`;
  }

  queryText += ` ORDER BY item_name ASC`;

  const result = await query(queryText, [restaurantId]);

  return ResponseHandler.success(res, result.rows);
});

// Get single inventory item
export const getInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      id, restaurant_id, item_name, unit, current_quantity,
      minimum_quantity, unit_cost, supplier_name, last_restocked_at,
      created_at, updated_at
    FROM inventory
    WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Inventory item not found', 404);
  }

  const item = result.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (item.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot access inventory from other restaurants', 403);
    }
  }

  return ResponseHandler.success(res, item);
});

// Create inventory item
export const createInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { restaurant_id, item_name, unit, current_quantity, minimum_quantity, unit_cost, supplier_name } = req.body;

  if (!restaurant_id || !item_name || !unit || current_quantity === undefined || minimum_quantity === undefined) {
    throw new AppError('Restaurant ID, item name, unit, current quantity, and minimum quantity are required', 400);
  }

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot create inventory for other restaurants', 403);
    }
  }

  const result = await query(
    `INSERT INTO inventory
      (restaurant_id, item_name, unit, current_quantity, minimum_quantity, unit_cost, supplier_name, last_restocked_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    RETURNING *`,
    [restaurant_id, item_name, unit, current_quantity, minimum_quantity, unit_cost || null, supplier_name || null]
  );

  return ResponseHandler.created(res, result.rows[0], 'Inventory item created successfully');
});

// Update inventory item
export const updateInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { item_name, unit, current_quantity, minimum_quantity, unit_cost, supplier_name } = req.body;

  // Get item to check ownership
  const itemCheck = await query('SELECT id, restaurant_id FROM inventory WHERE id = $1', [id]);

  if (itemCheck.rows.length === 0) {
    throw new AppError('Inventory item not found', 404);
  }

  const item = itemCheck.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (item.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot update inventory from other restaurants', 403);
    }
  }

  const result = await query(
    `UPDATE inventory
    SET 
      item_name = COALESCE($1, item_name),
      unit = COALESCE($2, unit),
      current_quantity = COALESCE($3, current_quantity),
      minimum_quantity = COALESCE($4, minimum_quantity),
      unit_cost = COALESCE($5, unit_cost),
      supplier_name = COALESCE($6, supplier_name),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING *`,
    [item_name, unit, current_quantity, minimum_quantity, unit_cost, supplier_name, id]
  );

  return ResponseHandler.success(res, result.rows[0], 'Inventory item updated successfully');
});

// Delete inventory item
export const deleteInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  // Get item to check ownership
  const itemCheck = await query('SELECT id, restaurant_id FROM inventory WHERE id = $1', [id]);

  if (itemCheck.rows.length === 0) {
    throw new AppError('Inventory item not found', 404);
  }

  const item = itemCheck.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (item.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot delete inventory from other restaurants', 403);
    }
  }

  await query('DELETE FROM inventory WHERE id = $1', [id]);

  return ResponseHandler.success(res, null, 'Inventory item deleted successfully');
});

// Create inventory transaction
export const createInventoryTransaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { inventory_id, transaction_type, quantity_change, notes } = req.body;

  if (!inventory_id || !transaction_type || quantity_change === undefined) {
    throw new AppError('Inventory ID, transaction type, and quantity change are required', 400);
  }

  // Validate transaction type
  const validTypes = ['restock', 'consumption', 'adjustment', 'wastage'];
  if (!validTypes.includes(transaction_type)) {
    throw new AppError('Invalid transaction type', 400);
  }

  // Get inventory item
  const inventoryResult = await query(
    'SELECT id, restaurant_id, current_quantity FROM inventory WHERE id = $1',
    [inventory_id]
  );

  if (inventoryResult.rows.length === 0) {
    throw new AppError('Inventory item not found', 404);
  }

  const inventory = inventoryResult.rows[0];

  // Restaurant access control
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (!req.user?.restaurantId) {
      throw new AppError('User is not assigned to a restaurant', 403);
    }
    if (inventory.restaurant_id !== req.user.restaurantId) {
      throw new AppError('Forbidden: Cannot create transactions for other restaurants', 403);
    }
  }

  // Calculate new quantity
  const currentQty = parseFloat(inventory.current_quantity);
  const change = parseFloat(quantity_change);
  const newQty = currentQty + change;

  if (newQty < 0) {
    throw new AppError('Transaction would result in negative inventory', 400);
  }

  // Create transaction
  const transactionResult = await query(
    `INSERT INTO inventory_transactions
      (inventory_id, transaction_type, quantity_change, notes, created_by_user_id, created_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    RETURNING *`,
    [inventory_id, transaction_type, change, notes || null, req.user?.id || null]
  );

  // Update inventory current quantity
  await query(
    `UPDATE inventory
    SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2`,
    [newQty, inventory_id]
  );

  // Update last_restocked_at if it's a restock
  if (transaction_type === 'restock') {
    await query(
      `UPDATE inventory
      SET last_restocked_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [inventory_id]
    );
  }

  return ResponseHandler.created(res, {
    ...transactionResult.rows[0],
    new_quantity: newQty.toFixed(2),
  }, 'Inventory transaction created successfully');
});

// Get inventory transactions
export const getInventoryTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { inventory_id } = req.query;

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
      it.id, it.inventory_id, it.transaction_type, it.quantity_change,
      it.notes, it.created_by_user_id, it.created_at,
      i.item_name, i.unit,
      u.name as created_by_name
    FROM inventory_transactions it
    JOIN inventory i ON it.inventory_id = i.id
    LEFT JOIN users u ON it.created_by_user_id = u.id
    WHERE i.restaurant_id = $1
  `;
  const params: any[] = [restaurantId];

  if (inventory_id) {
    queryText += ` AND it.inventory_id = $2`;
    params.push(inventory_id);
  }

  queryText += ` ORDER BY it.created_at DESC LIMIT 100`;

  const result = await query(queryText, params);

  return ResponseHandler.success(res, result.rows);
});

// Get low stock alerts
export const getLowStockAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
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
      id, item_name, unit, current_quantity, minimum_quantity,
      unit_cost, supplier_name, last_restocked_at
    FROM inventory
    WHERE restaurant_id = $1 AND current_quantity <= minimum_quantity
    ORDER BY (current_quantity / NULLIF(minimum_quantity, 0)) ASC`,
    [restaurantId]
  );

  return ResponseHandler.success(res, result.rows);
});
