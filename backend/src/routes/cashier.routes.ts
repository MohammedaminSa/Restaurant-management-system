import { Router } from 'express';
import { 
  getActiveSessions,
  getSessionBill,
  getSessionOrders,
  recordPayment,
  approvePayment,
  getPayment,
  getTodayTransactions
} from '@/controllers/cashier.controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { UserRole } from '@/interfaces/index';

const router = Router();

// All cashier routes require authentication
router.use(authenticate);

// Cashier can view sessions and process payments
router.get(
  '/cashier/sessions/active',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  getActiveSessions
);

router.get(
  '/cashier/sessions/:token/bill',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  getSessionBill
);

router.get(
  '/cashier/sessions/:token/orders',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  getSessionOrders
);

router.post(
  '/cashier/payments',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  recordPayment
);

router.post(
  '/cashier/payments/approve',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  approvePayment
);

router.get(
  '/cashier/payments/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  getPayment
);

router.get(
  '/cashier/transactions/today',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  getTodayTransactions
);

export default router;
