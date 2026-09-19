import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import cartRouter from './routes/cart.js';
import checkoutCodRouter from './routes/checkoutCod.js';
import checkoutRazorpayRouter from './routes/checkoutRazorpay.js';
import pincodeRouter from './routes/pincode.js';
import adminRouter from './routes/admin.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import customerAuthRouter from './routes/customerAuth.js';
import ordersRouter from './routes/orders.js';
import { ensureDatabaseInitialized } from './lib/auto-init.js';

const app: Express = express();
const PORT = process.env.PORT || 5000;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [APP_URL, 'http://localhost:3000', 'http://localhost:3001'];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ravivision-backend', timestamp: new Date().toISOString() });
});

// Manual Setup & Database Catalog Import Trigger Endpoint
app.get('/api/setup/init-database', async (req: Request, res: Response) => {
  try {
    await ensureDatabaseInitialized();
    res.json({ success: true, message: 'Database initialization and Excel catalog import verified successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Initialization failed' });
  }
});

// API Routes
app.use('/api/cart', cartRouter);
app.use('/api/checkout/cod', checkoutCodRouter);
app.use('/api/checkout/razorpay', checkoutRazorpayRouter);
app.use('/api/pincode', pincodeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/auth/customer', customerAuthRouter);
app.use('/api/orders', ordersRouter);

// Start Server & Auto-Init DB
const SERVER_PORT = Number(PORT);
app.listen(SERVER_PORT, '0.0.0.0', async () => {
  console.log(`⚡ [Ravi Vision Backend]: Server running on http://0.0.0.0:${SERVER_PORT} (Listening for Mobile & Web)`);
  await ensureDatabaseInitialized();
});

