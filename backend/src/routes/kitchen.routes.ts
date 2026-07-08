import { Router } from 'express';
import { 
  getKitchenOrders, 
  updateKitchenOrderStatus,
  updateOrderItemStatus
} from '@/controllers/kitchen.controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { UserRole } from '@/interfaces/index';

const router = Router();

// All kitchen routes require authentication
router.use(authenticate);

// Kitchen staff can view and update orders
router.get(
  '/kitchen/orders',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.KITCHEN_STAFF),
  getKitchenOrders
);

router.patch(
  '/kitchen/orders/:id/status',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.KITCHEN_STAFF),
  updateKitchenOrderStatus
);

router.patch(
  '/kitchen/order-items/:id/status',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.KITCHEN_STAFF),
  updateOrderItemStatus
);

export default router;
