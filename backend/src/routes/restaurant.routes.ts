import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  toggleRestaurantStatus,
  getRestaurantPublic,
} from '@controllers/restaurant.controller';
import { authenticate, authorize } from '@middlewares/auth';
import { validate } from '@middlewares/validator';
import { UserRole } from '@/interfaces/index';

const router = Router();

router.get('/public/info', getRestaurantPublic);

router.get(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  getRestaurants
);

router.get(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  [param('id').isUUID().withMessage('Valid restaurant ID is required'), validate],
  getRestaurantById
);

router.post(
  '/',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  [
    body('name').notEmpty().withMessage('Restaurant name is required'),
    validate,
  ],
  createRestaurant
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  [
    param('id').isUUID().withMessage('Valid restaurant ID is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validate,
  ],
  updateRestaurant
);

router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  [param('id').isUUID().withMessage('Valid restaurant ID is required'), validate],
  deleteRestaurant
);

router.patch(
  '/:id/toggle',
  authenticate,
  authorize(UserRole.SUPER_ADMIN),
  [param('id').isUUID().withMessage('Valid restaurant ID is required'), validate],
  toggleRestaurantStatus
);

export default router;
