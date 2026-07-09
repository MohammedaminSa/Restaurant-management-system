import { Router } from 'express';
import { 
  getPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion
} from '@/controllers/promotion.controller';
import { authenticate, authorize } from '@/middlewares/auth';
import { UserRole } from '@/interfaces/index';

const router = Router();

// All promotion routes require authentication
router.use(authenticate);

// Promotion management
router.get(
  '/admin/promotions',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  getPromotions
);

router.get(
  '/admin/promotions/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  getPromotion
);

router.post(
  '/admin/promotions',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  createPromotion
);

router.put(
  '/admin/promotions/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  updatePromotion
);

router.delete(
  '/admin/promotions/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  deletePromotion
);

export default router;
