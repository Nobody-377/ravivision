import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

const ALLOWED_PINCODES = [
  '821107', // Kargahar (Local)
  '821112', // Kochas
  '821115', // Sasaram (Head Office)
  '821104', // Chenari
  '802215', // Garh Nokha
  '821113', // Sheosagar
  '821108', // Kudra
  '802212', // Bikramganj
  '821307', // Dehri-on-Sone
  '821109', // Mohania
];

const CUSTOMER_SESSION_COOKIE = 'ravi_customer_session';

// GET /api/auth/customer - Fetch current customer profile
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies[CUSTOMER_SESSION_COOKIE] || req.headers.authorization?.replace('Bearer ', '');
    if (!sessionToken) {
      return res.json({ success: true, customer: null });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: sessionToken },
          { mobileNumber: sessionToken },
        ],
      },
    });

    return res.json({
      success: true,
      customer: customer || null,
    });
  } catch (error: any) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({ success: false, customer: null });
  }
});

// POST /api/auth/customer - Customer Login / Registration
router.post('/', async (req: Request, res: Response) => {
  try {
    const { action = 'login', name, mobileNumber, pincode } = req.body;
    const cleanedMobile = (mobileNumber || '').replace(/\D/g, '').trim();

    if (!cleanedMobile || cleanedMobile.length !== 10) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_MOBILE', message: 'Please enter a valid 10-digit mobile number.' },
      });
    }

    if (action === 'login') {
      const customer = await prisma.customer.findUnique({
        where: { mobileNumber: cleanedMobile },
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'No account found with this mobile number. Please sign up to place orders.',
          },
        });
      }

      res.cookie(CUSTOMER_SESSION_COOKIE, customer.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return res.json({
        success: true,
        message: `Welcome back, ${customer.name || 'Customer'}!`,
        customer,
        token: customer.id,
      });
    } else {
      // Signup
      const cleanName = (name || '').trim();
      const cleanPincode = (pincode || '').trim();

      if (!cleanName || cleanName.length < 2) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_NAME', message: 'Please enter your full name.' },
        });
      }

      if (cleanPincode && !ALLOWED_PINCODES.includes(cleanPincode)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PINCODE_NOT_SERVICED',
            message: `Delivery is currently restricted to Kargahar & nearby regions (${ALLOWED_PINCODES.join(', ')}).`,
          },
        });
      }

      const existing = await prisma.customer.findUnique({
        where: { mobileNumber: cleanedMobile },
      });

      if (existing) {
        res.cookie(CUSTOMER_SESSION_COOKIE, existing.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 24 * 60 * 60 * 1000,
          path: '/',
        });

        return res.json({
          success: true,
          message: 'Account already exists. Logged in successfully.',
          customer: existing,
          token: existing.id,
        });
      }

      const newCustomer = await prisma.customer.create({
        data: {
          name: cleanName,
          mobileNumber: cleanedMobile,
          pincode: cleanPincode || '821107',
        },
      });

      res.cookie(CUSTOMER_SESSION_COOKIE, newCustomer.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return res.json({
        success: true,
        message: 'Account created successfully!',
        customer: newCustomer,
        token: newCustomer.id,
      });
    }
  } catch (error: any) {
    console.error('Customer auth error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Authentication processing failed.' },
    });
  }
});

// POST /api/auth/customer/logout - Clear customer session
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie(CUSTOMER_SESSION_COOKIE, { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
