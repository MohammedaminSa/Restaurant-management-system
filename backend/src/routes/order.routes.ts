import { Router } from 'express';
import { 
  createOrder, 
  getOrderById, 
  getSessionOrders, 
  updateOrderStatus 
} from '@/controllers/order.controller';

const router = Router();

// Public routes (no authentication required for customers)
router.post('/orders', createOrder);
router.get('/orders/:id', getOrderById);
router.get('/sessions/:token/orders', getSessionOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
