import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getCategories,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} from '@controllers/menu.controller';
import { authenticate, authorize } from '@middlewares/auth';
import { validate } from '@middlewares/validator';

const router = Router();

// Public routes (no authentication required)

// GET /api/v1/menu/categories - Get all categories
router.get('/categories', getCategories);

// GET /api/v1/menu/items - Get all menu items with filtering
router.get('/items', getMenuItems);

// GET /api/v1/menu/items/:id - Get single menu item with variants
router.get(
  '/items/:id',
  [param('id').isUUID().withMessage('Valid item ID is required'), validate],
  getMenuItemById
);

// Admin only routes

// POST /api/v1/menu/items - Create menu item
router.post(
  '/items',
  authenticate,
  authorize(['super_admin', 'restaurant_admin']),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('base_price').isFloat({ min: 0 }).withMessage('Valid base price is required'),
    body('category_id').isUUID().withMessage('Valid category ID is required'),
    body('restaurant_id').optional().isUUID().withMessage('Valid restaurant ID is required'),
    validate,
  ],
  createMenuItem
);

// PUT /api/v1/menu/items/:id - Update menu item
router.put(
  '/items/:id',
  authenticate,
  authorize(['super_admin', 'restaurant_admin']),
  [
    param('id').isUUID().withMessage('Valid item ID is required'),
    body('base_price').optional().isFloat({ min: 0 }).withMessage('Valid base price is required'),
    validate,
  ],
  updateMenuItem
);

// DELETE /api/v1/menu/items/:id - Delete menu item
router.delete(
  '/items/:id',
  authenticate,
  authorize(['super_admin', 'restaurant_admin']),
  [param('id').isUUID().withMessage('Valid item ID is required'), validate],
  deleteMenuItem
);

// PATCH /api/v1/menu/items/:id/toggle - Toggle availability
router.patch(
  '/items/:id/toggle',
  authenticate,
  authorize(['super_admin', 'restaurant_admin']),
  [param('id').isUUID().withMessage('Valid item ID is required'), validate],
  toggleAvailability
);

export default router;
