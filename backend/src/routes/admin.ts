import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { generateRawToken, hashToken } from '../lib/session.js';
import { getStoreConfig } from '../lib/store-config.js';

const router = Router();
const ADMIN_SESSION_COOKIE = 'ravi_admin_token';

// Middleware to authenticate admin session
async function requireAdminAuth(req: Request, res: Response, next: () => void) {
  const token = req.cookies[ADMIN_SESSION_COOKIE];
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } });
  }

  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
  });

  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ success: false, error: { code: 'SESSION_EXPIRED', message: 'Session has expired.' } });
  }

  next();
}

// POST /api/admin/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Username and password required.' } });
    }

    const admin = await prisma.adminUser.findUnique({ where: { username: username.trim() } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin credentials.' } });
    }

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.adminSession.create({
      data: {
        tokenHash,
        userId: admin.id,
        expiresAt,
      },
    });

    res.cookie(ADMIN_SESSION_COOKIE, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      data: {
        username: admin.username,
        name: admin.name,
        mustChangePassword: admin.mustChangePassword,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Login failed.' } });
  }
});

// POST /api/admin/auth/logout
router.post('/auth/logout', async (req: Request, res: Response) => {
  const token = req.cookies[ADMIN_SESSION_COOKIE];
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.adminSession.deleteMany({ where: { tokenHash } });
  }
  res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/admin/change-password
router.post('/change-password', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.cookies[ADMIN_SESSION_COOKIE];
    const session = await prisma.adminSession.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!session) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });

    const admin = await prisma.adminUser.findUnique({ where: { id: session.userId } });
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' } });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash, mustChangePassword: false },
    });

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
  }
});

// GET /api/admin/delivery
router.get('/delivery', requireAdminAuth, async (req: Request, res: Response) => {
  const zones = await prisma.deliveryZone.findMany({ orderBy: { pincode: 'asc' } });
  return res.json({ success: true, data: zones });
});

// POST /api/admin/delivery
router.post('/delivery', requireAdminAuth, async (req: Request, res: Response) => {
  const { pincode, area, city, active, oneDayDelivery, deliveryCharge } = req.body;
  const zone = await prisma.deliveryZone.create({
    data: {
      pincode: pincode.trim(),
      area: area.trim(),
      city: city.trim(),
      active: Boolean(active),
      oneDayDelivery: Boolean(oneDayDelivery),
      deliveryCharge: Number(deliveryCharge || 0),
    },
  });
  return res.json({ success: true, data: zone });
});

// GET /api/admin/orders
router.get('/orders', requireAdminAuth, async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: { items: true, statusHistory: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: orders });
});

// PUT /api/admin/orders
router.put('/orders', requireAdminAuth, async (req: Request, res: Response) => {
  const { orderId, orderStatus, note } = req.body;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus,
      statusHistory: {
        create: {
          previousStatus: order.orderStatus,
          newStatus: orderStatus,
          changedBy: 'admin',
          note: note || `Order status updated to ${orderStatus}.`,
        },
      },
    },
    include: { items: true, statusHistory: true },
  });

  return res.json({ success: true, data: updated });
});

// GET /api/admin/products
router.get('/products', requireAdminAuth, async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    include: { images: true },
    orderBy: { updatedAt: 'desc' },
  });
  return res.json({ success: true, data: products });
});

// POST /api/admin/products
router.post('/products', requireAdminAuth, async (req: Request, res: Response) => {
  const { name, brand, sku, price, mrp, stock, status, isFeatured, isBestSeller, description, imageUrl } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      brand,
      sku,
      price: Number(price),
      mrp: Number(mrp),
      stock: Number(stock),
      status: status || 'ACTIVE',
      isFeatured: Boolean(isFeatured),
      isBestSeller: Boolean(isBestSeller),
      description,
      images: imageUrl ? { create: { url: imageUrl, isPrimary: true } } : undefined,
    },
    include: { images: true },
  });

  return res.json({ success: true, data: product });
});

// GET /api/admin/settings
router.get('/settings', requireAdminAuth, async (req: Request, res: Response) => {
  const config = await getStoreConfig();
  return res.json({ success: true, data: config });
});

// PUT /api/admin/settings
router.put('/settings', requireAdminAuth, async (req: Request, res: Response) => {
  const { codEnabled, storePhone } = req.body;

  if (typeof codEnabled === 'boolean') {
    await prisma.storeSetting.upsert({
      where: { key: 'COD_ENABLED' },
      update: { value: String(codEnabled) },
      create: { key: 'COD_ENABLED', value: String(codEnabled) },
    });
  }

  if (storePhone) {
    await prisma.storeSetting.upsert({
      where: { key: 'STORE_PHONE' },
      update: { value: storePhone.trim() },
      create: { key: 'STORE_PHONE', value: storePhone.trim() },
    });
  }

  const updatedConfig = await getStoreConfig();
  return res.json({ success: true, data: updatedConfig });
});

export default router;
