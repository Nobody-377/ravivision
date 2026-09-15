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

// POST /api/admin/auth/register
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Name, username, and password required.' } });
    }

    const existing = await prisma.adminUser.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_EXISTS', message: 'Admin username already taken.' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.adminUser.create({
      data: {
        username: username.trim(),
        name: name.trim(),
        passwordHash,
      },
    });

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Registration failed.' } });
  }
});

// GET /api/admin/auth/me
router.get('/auth/me', async (req: Request, res: Response) => {
  const token = req.cookies[ADMIN_SESSION_COOKIE];
  if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });

  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({ where: { tokenHash } });
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ success: false, error: { code: 'SESSION_EXPIRED' } });
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!admin) return res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND' } });

  return res.json({
    success: true,
    data: {
      username: admin.username,
      name: admin.name,
    },
  });
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

// PATCH /api/admin/delivery/:id
router.patch('/delivery/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { pincode, area, city, active, oneDayDelivery, deliveryCharge, notes } = req.body;
  const updated = await prisma.deliveryZone.update({
    where: { id },
    data: {
      pincode: pincode !== undefined ? pincode.trim() : undefined,
      area: area !== undefined ? area.trim() : undefined,
      city: city !== undefined ? city.trim() : undefined,
      active: active !== undefined ? Boolean(active) : undefined,
      oneDayDelivery: oneDayDelivery !== undefined ? Boolean(oneDayDelivery) : undefined,
      deliveryCharge: deliveryCharge !== undefined ? Number(deliveryCharge) : undefined,
      notes: notes !== undefined ? notes : undefined,
    },
  });
  return res.json({ success: true, data: updated });
});

// DELETE /api/admin/delivery/:id
router.delete('/delivery/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.deliveryZone.delete({ where: { id } });
  return res.json({ success: true, message: 'Delivery zone deleted.' });
});

// GET /api/admin/orders
router.get('/orders', requireAdminAuth, async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    include: { items: true, payments: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: orders });
});

// PATCH /api/admin/orders/:id/status
router.patch('/orders/:id/status', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } });

  const updated = await prisma.order.update({
    where: { id },
    data: {
      orderStatus: status,
      statusHistory: {
        create: {
          previousStatus: order.orderStatus,
          newStatus: status,
          changedBy: 'admin',
          note: note || `Order status updated to ${status}.`,
        },
      },
    },
    include: { items: true, payments: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
  });

  return res.json({ success: true, data: updated });
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
    include: { items: true, payments: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
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

// PATCH /api/admin/products/:id
router.patch('/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stock, price, mrp, status, specifications, requiresInstallation, installationDetails } = req.body;
  const updated = await prisma.product.update({
    where: { id },
    data: {
      stock: stock !== undefined ? Number(stock) : undefined,
      price: price !== undefined ? Number(price) : undefined,
      mrp: mrp !== undefined ? Number(mrp) : undefined,
      status: status !== undefined ? status : undefined,
      specifications: specifications !== undefined ? specifications : undefined,
      requiresInstallation: requiresInstallation !== undefined ? Boolean(requiresInstallation) : undefined,
      installationDetails: installationDetails !== undefined ? installationDetails : undefined,
    },
    include: { images: true },
  });
  return res.json({ success: true, data: updated });
});

// POST /api/admin/products
router.post('/products', requireAdminAuth, async (req: Request, res: Response) => {
  const { name, brand, sku, price, mrp, stock, status, isFeatured, isBestSeller, description, imageUrl, specifications, requiresInstallation } = req.body;
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
      specifications: specifications || null,
      requiresInstallation: Boolean(requiresInstallation),
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
