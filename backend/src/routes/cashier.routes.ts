import { Router } from 'express';
import { 
  getActiveSessions,
  getSessionBill,
  getSessionOrders,
  recordPayment,
  approvePayment,
  rejectPayment,
  deleteRejectedPayment,
  getPendingPayments,
  getRejectedPayments,
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

router.get(
  '/cashier/payments/pending',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  getPendingPayments
);

router.get(
  '/cashier/payments/rejected',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  getRejectedPayments
);

router.post(
  '/cashier/payments/approve',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  approvePayment
);

router.post(
  '/cashier/payments/reject',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  rejectPayment
);

router.delete(
  '/cashier/payments/rejected/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN, UserRole.CASHIER),
  deleteRejectedPayment
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
