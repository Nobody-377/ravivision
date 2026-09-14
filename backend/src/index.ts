import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import cartRouter from './routes/cart.js';
import checkoutCodRouter from './routes/checkoutCod.js';
import checkoutRazorpayRouter from './routes/checkoutRazorpay.js';
import pincodeRouter from './routes/pincode.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Middleware
app.use(
  cors({
    origin: APP_URL,
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

// API Routes
app.use('/api/cart', cartRouter);
app.use('/api/checkout/cod', checkoutCodRouter);
app.use('/api/checkout/razorpay', checkoutRazorpayRouter);
app.use('/api/pincode', pincodeRouter);
app.use('/api/admin', adminRouter);

// Start Server
app.listen(PORT, () => {
  console.log(`⚡ [Ravi Vision Backend]: Server running on http://localhost:${PORT}`);
});
