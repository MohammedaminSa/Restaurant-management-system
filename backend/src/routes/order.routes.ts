import { Router } from 'express';
import { body, param } from 'express-validator';
import { 
  createOrder, 
  getOrderById, 
  getSessionOrders, 
  updateOrderStatus 
} from '@/controllers/order.controller';
import { authenticate, authorize } from '@middlewares/auth';
import { validate } from '@middlewares/validator';
import { UserRole } from '@/interfaces/index';

const router = Router();

// Public routes (no authentication required for customers)
router.post('/orders', createOrder);
router.get('/orders/:id', getOrderById);
router.get('/sessions/:token/orders', getSessionOrders);

// Protected route — only kitchen_staff or admin can update order status
router.patch(
  '/orders/:id/status',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.KITCHEN_STAFF),
  [
    param('id').isUUID().withMessage('Valid order ID is required'),
    body('status').isIn(['pending', 'preparing', 'ready', 'served', 'cancelled']).withMessage('Valid status is required'),
    validate,
  ],
  updateOrderStatus
);

export default router;
