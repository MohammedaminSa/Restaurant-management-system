import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  generateQRCode,
  getTableByQRCode,
  updateTableStatus,
} from '@controllers/table.controller';
import { authenticate, authorize } from '@middlewares/auth';
import { validate } from '@middlewares/validator';
import { UserRole } from '@/interfaces/index';

const router = Router();

// Admin routes

// GET /api/v1/tables - Get all tables
router.get(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.WAITER),
  getTables
);

// GET /api/v1/tables/:id - Get table by ID
router.get(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.WAITER),
  [param('id').isUUID().withMessage('Valid table ID is required'), validate],
  getTableById
);

// POST /api/v1/tables - Create table
router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  [
    body('restaurant_id').isUUID().withMessage('Valid restaurant ID is required'),
    body('table_number').notEmpty().withMessage('Table number is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Valid capacity is required'),
    validate,
  ],
  createTable
);

// PUT /api/v1/tables/:id - Update table
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  [
    param('id').isUUID().withMessage('Valid table ID is required'),
    body('capacity').optional().isInt({ min: 1 }).withMessage('Valid capacity is required'),
    validate,
  ],
  updateTable
);

// DELETE /api/v1/tables/:id - Delete table
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  [param('id').isUUID().withMessage('Valid table ID is required'), validate],
  deleteTable
);

// PATCH /api/v1/tables/:id/status - Update table status
router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.WAITER),
  [
    param('id').isUUID().withMessage('Valid table ID is required'),
    body('status').notEmpty().withMessage('Status is required'),
    validate,
  ],
  updateTableStatus
);

// GET /api/v1/tables/:id/qr - Generate QR code
router.get(
  '/:id/qr',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  [param('id').isUUID().withMessage('Valid table ID is required'), validate],
  generateQRCode
);

// Public route for QR code scanning

// GET /api/v1/tables/scan/:qrCode - Get table by QR code (public)
router.get('/scan/:qrCode', getTableByQRCode);

export default router;
