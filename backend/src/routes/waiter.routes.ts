import { Router } from 'express';
import { 
  getWaiterTables,
  getWaiterOrders,
  createWaiterOrder,
  markOrderServed
} from '@/controllers/waiter.controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { UserRole } from '@/interfaces/index';

const router = Router();

// All waiter routes require authentication
router.use(authenticate);

// Waiter can view tables and orders
router.get(
  '/waiter/tables',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.WAITER, UserRole.CASHIER),
  getWaiterTables
);

router.get(
  '/waiter/orders',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.WAITER),
  getWaiterOrders
);

// Waiter can place orders on behalf of customers
router.post(
  '/waiter/orders',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.WAITER),
  createWaiterOrder
);

// Waiter can mark orders as served
router.patch(
  '/waiter/orders/:id/serve',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.WAITER),
  markOrderServed
);

export default router;
