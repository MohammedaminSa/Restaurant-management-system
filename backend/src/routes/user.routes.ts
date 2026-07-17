import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updatePassword,
  deleteUser,
} from '@controllers/user.controller';
import { authenticate, authorize } from '@middlewares/auth';
import { validate } from '@middlewares/validator';
import { UserRole } from '@/interfaces/index';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/users
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  getAllUsers
);

// GET /api/v1/users/:userId
router.get(
  '/:userId',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    validate,
  ],
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  getUserById
);

// POST /api/v1/users
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(Object.values(UserRole)).withMessage('Valid role is required'),
    body('restaurant_id').optional().isUUID().withMessage('Valid restaurant ID required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    validate,
  ],
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  createUser
);

// PUT /api/v1/users/:userId
router.put(
  '/:userId',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(Object.values(UserRole)).withMessage('Valid role is required'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
    body('restaurant_id').optional().isUUID().withMessage('Valid restaurant ID required'),
    validate,
  ],
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  updateUser
);

// PATCH /api/v1/users/:userId/password
router.patch(
  '/:userId/password',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('currentPassword').optional().notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate,
  ],
  updatePassword
);

// DELETE /api/v1/users/:userId
router.delete(
  '/:userId',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    validate,
  ],
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  deleteUser
);

export default router;
