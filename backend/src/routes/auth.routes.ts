import { Router } from 'express';
import { body } from 'express-validator';
import { login, refreshToken, getCurrentUser, logout } from '@controllers/auth.controller';
import { authenticate } from '@middlewares/auth';
import { validate } from '@middlewares/validator';

const router = Router();

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate,
  ],
  refreshToken
);

// GET /api/v1/auth/me (protected)
router.get('/me', authenticate, getCurrentUser);

// POST /api/v1/auth/logout (protected)
router.post('/logout', authenticate, logout);

export default router;
