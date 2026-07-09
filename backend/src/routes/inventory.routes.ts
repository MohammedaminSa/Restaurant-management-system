import { Router } from 'express';
import { 
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryTransaction,
  getInventoryTransactions,
  getLowStockAlerts
} from '@/controllers/inventory.controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { UserRole } from '@/interfaces/index';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Inventory management
router.get(
  '/admin/inventory',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  getInventory
);

router.get(
  '/admin/inventory/low-stock',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  getLowStockAlerts
);

router.get(
  '/admin/inventory/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  getInventoryItem
);

router.post(
  '/admin/inventory',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  createInventoryItem
);

router.put(
  '/admin/inventory/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  updateInventoryItem
);

router.delete(
  '/admin/inventory/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  deleteInventoryItem
);

// Inventory transactions
router.post(
  '/admin/inventory/transactions',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  createInventoryTransaction
);

router.get(
  '/admin/inventory/transactions',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  getInventoryTransactions
);

export default router;
