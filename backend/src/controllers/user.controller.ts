import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, UserRole } from '@types/index';
import { query } from '@config/database';
import { ResponseHandler } from '@utils/responseHandler';
import { asyncHandler } from '@middlewares/errorHandler';
import { AppError } from '@middlewares/errorHandler';

// Get all users (Admin only)
export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  // Filter by restaurant if not super admin
  let queryText = 'SELECT id, email, role, restaurant_id, name, phone, avatar_url, is_active, created_at FROM users';
  let params: any[] = [];

  if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.restaurantId) {
    queryText += ' WHERE restaurant_id = $1';
    params.push(req.user.restaurantId);
  }

  queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(Number(pageSize), offset);

  const result = await query(queryText, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM users';
  let countParams: any[] = [];
  
  if (req.user?.role !== UserRole.SUPER_ADMIN && req.user?.restaurantId) {
    countQuery += ' WHERE restaurant_id = $1';
    countParams.push(req.user.restaurantId);
  }

  const countResult = await query(countQuery, countParams);
  const totalItems = parseInt(countResult.rows[0].count);

  return ResponseHandler.paginated(res, result.rows, Number(page), Number(pageSize), totalItems);
});

// Get user by ID
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  const result = await query(
    'SELECT id, email, role, restaurant_id, name, phone, avatar_url, is_active, created_at FROM users WHERE id = $1',
    [userId]
  );

  const user = result.rows[0];

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check access rights
  if (req.user?.role !== UserRole.SUPER_ADMIN && user.restaurant_id !== req.user?.restaurantId) {
    throw new AppError('Forbidden: Cannot access this user', 403);
  }

  return ResponseHandler.success(res, user);
});

// Create user (Admin only)
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, role, restaurant_id, name, phone } = req.body;

  // Check if email already exists
  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);

  if (existingUser.rows.length > 0) {
    throw new AppError('Email already in use', 409);
  }

  // Validate restaurant access
  if (req.user?.role !== UserRole.SUPER_ADMIN) {
    if (restaurant_id !== req.user?.restaurantId) {
      throw new AppError('Forbidden: Cannot create user for different restaurant', 403);
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const result = await query(
    `INSERT INTO users (email, password_hash, role, restaurant_id, name, phone) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id, email, role, restaurant_id, name, phone, is_active, created_at`,
    [email, passwordHash, role, restaurant_id, name, phone]
  );

  const newUser = result.rows[0];

  return ResponseHandler.created(res, newUser, 'User created successfully');
});

// Update user
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { email, role, name, phone, is_active, avatar_url } = req.body;

  // Check if user exists
  const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check access rights
  if (req.user?.role !== UserRole.SUPER_ADMIN && user.restaurant_id !== req.user?.restaurantId) {
    throw new AppError('Forbidden: Cannot update this user', 403);
  }

  // Update user
  const result = await query(
    `UPDATE users 
     SET email = COALESCE($1, email), 
         role = COALESCE($2, role), 
         name = COALESCE($3, name), 
         phone = COALESCE($4, phone), 
         is_active = COALESCE($5, is_active),
         avatar_url = COALESCE($6, avatar_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $7 
     RETURNING id, email, role, restaurant_id, name, phone, avatar_url, is_active, updated_at`,
    [email, role, name, phone, is_active, avatar_url, userId]
  );

  return ResponseHandler.success(res, result.rows[0], 'User updated successfully');
});

// Update password
export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Only allow users to change their own password or admin to change any password
  if (req.user?.id !== userId && req.user?.role !== UserRole.SUPER_ADMIN && req.user?.role !== UserRole.RESTAURANT_ADMIN) {
    throw new AppError('Forbidden: Cannot change this password', 403);
  }

  // Get user
  const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // If changing own password, verify current password
  if (req.user?.id === userId) {
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, userId]);

  return ResponseHandler.success(res, null, 'Password updated successfully');
});

// Delete user
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  // Check if user exists
  const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check access rights
  if (req.user?.role !== UserRole.SUPER_ADMIN && user.restaurant_id !== req.user?.restaurantId) {
    throw new AppError('Forbidden: Cannot delete this user', 403);
  }

  // Cannot delete yourself
  if (req.user?.id === userId) {
    throw new AppError('Cannot delete your own account', 400);
  }

  // Delete user
  await query('DELETE FROM users WHERE id = $1', [userId]);

  return ResponseHandler.success(res, null, 'User deleted successfully');
});
