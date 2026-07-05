import jwt from 'jsonwebtoken';
import { User } from '@types/index';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  restaurantId?: string;
}

export const generateAccessToken = (user: Partial<User>): string => {
  const payload: TokenPayload = {
    id: user.id!,
    email: user.email!,
    role: user.role!,
    restaurantId: user.restaurant_id,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

export const generateRefreshToken = (user: Partial<User>): string => {
  const payload: TokenPayload = {
    id: user.id!,
    email: user.email!,
    role: user.role!,
    restaurantId: user.restaurant_id,
  };

  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.verify(token, secret) as TokenPayload;
};
