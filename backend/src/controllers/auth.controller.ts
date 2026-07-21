import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '@/interfaces/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@utils/jwt';

// Login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Find user by email
  const result = await query(
    `SELECT u.*, r.is_active as restaurant_active 
     FROM users u 
     LEFT JOIN restaurants r ON u.restaurant_id = r.id 
     WHERE u.email = $1 AND u.is_active = true`,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user's restaurant is active
  if (user.restaurant_id && !user.restaurant_active) {
    throw new AppError('Your restaurant has been deactivated. Please contact your super admin.', 403);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Remove password from response
  delete user.password_hash;

  return ResponseHandler.success(res, {
    user,
    accessToken,
    refreshToken,
  }, 'Login successful');
});

// Refresh token
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    return ResponseHandler.success(res, {
      accessToken: newAccessToken,
    }, 'Token refreshed successfully');
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  // Get full user details
  const result = await query(
    'SELECT id, email, role, restaurant_id, name, phone, avatar_url, is_active FROM users WHERE id = $1',
    [req.user.id]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return ResponseHandler.success(res, user);
});

// Update own profile
export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { name, email, phone } = req.body;

  const result = await query(
    `UPDATE users 
     SET name = COALESCE($1, name), 
         email = COALESCE($2, email), 
         phone = COALESCE($3, phone),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 
     RETURNING id, email, role, restaurant_id, name, phone, avatar_url, is_active, updated_at`,
    [name, email, phone, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  return ResponseHandler.success(res, result.rows[0], 'Profile updated successfully');
});

// Logout (client-side token removal, but we can blacklist token here if needed)
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a more advanced setup, you would blacklist the token in Redis
  // For now, client just removes the token
  return ResponseHandler.success(res, null, 'Logout successful');
});
