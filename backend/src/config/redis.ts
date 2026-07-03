import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client
export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// Error handling
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✓ Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('✓ Redis client ready');
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Don't exit process - app can work without Redis (though with reduced performance)
  }
};

// Helper functions for common Redis operations
export const redisHelpers = {
  // Set value with optional expiry (in seconds)
  set: async (key: string, value: any, expirySeconds?: number) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (expirySeconds) {
        await redisClient.setEx(key, expirySeconds, stringValue);
      } else {
        await redisClient.set(key, stringValue);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  },

  // Get value
  get: async (key: string) => {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  // Delete key
  del: async (key: string) => {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
    }
  },

  // Check if key exists
  exists: async (key: string) => {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return 0;
    }
  },

  // Set expiry on existing key
  expire: async (key: string, seconds: number) => {
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
    }
  },
};

export default redisClient;
