import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from '@middlewares/errorHandler';

dotenv.config();

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [process.env.CORS_ORIGIN].filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.startsWith('/api/seed'),
  message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Server is running successfully' });
});

// Seed endpoints (call with ?key=your-seed-secret)
const checkSeedKey = (req: Request, res: Response) => {
  if (req.query.key !== process.env.SEED_SECRET) {
    res.status(403).json({ success: false, error: 'Invalid seed key' });
    return false;
  }
  return true;
};

app.get('/api/seed', async (req: Request, res: Response) => {
  if (!checkSeedKey(req, res)) return;
  try {
    const { runSeed } = await import('./database/seed.js');
    await runSeed();
    res.json({ success: true, message: 'Seed completed' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/seed/menu', async (req: Request, res: Response) => {
  if (!checkSeedKey(req, res)) return;
  try {
    const { seedMenuData } = await import('./database/seed-menu.js');
    await seedMenuData();
    res.json({ success: true, message: 'Menu seed completed' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/seed/tables', async (req: Request, res: Response) => {
  if (!checkSeedKey(req, res)) return;
  try {
    const { seedTables } = await import('./database/seed-tables.js');
    await seedTables();
    res.json({ success: true, message: 'Tables seed completed' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import menuRoutes from './routes/menu.routes';
import tableRoutes from './routes/table.routes';
import sessionRoutes from './routes/session.routes';
import orderRoutes from './routes/order.routes';
import kitchenRoutes from './routes/kitchen.routes';
import waiterRoutes from './routes/waiter.routes';
import cashierRoutes from './routes/cashier.routes';
import inventoryRoutes from './routes/inventory.routes';
import promotionRoutes from './routes/promotion.routes';
import restaurantRoutes from './routes/restaurant.routes';

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/tables', tableRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', kitchenRoutes);
app.use('/api/v1', waiterRoutes);
app.use('/api/v1', cashierRoutes);
app.use('/api/v1', inventoryRoutes);
app.use('/api/v1', promotionRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
