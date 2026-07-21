import app from './app';
import { pool } from '@config/database';
import { connectRedis } from '@config/redis';
import { runMigrations } from '@database/migrate';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize connections and start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection test passed');

    // Run auto-migrations for missing columns
    await runMigrations();

    // Connect to Redis (optional - only if enabled in .env)
    await connectRedis();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log('=================================');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ API: http://localhost:${PORT}`);
      console.log('=================================');
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\n⚠️  Shutting down gracefully...');
      
      server.close(() => {
        console.log('✓ HTTP server closed');
      });

      try {
        await pool.end();
        console.log('✓ Database connections closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }

      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
