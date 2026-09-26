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

// POST /api/admin/auth/clear-all-sessions
router.post('/auth/clear-all-sessions', async (req: Request, res: Response) => {
  try {
    const deleted = await prisma.adminSession.deleteMany({});
    res.clearCookie(ADMIN_SESSION_COOKIE, { path: '/' });
    return res.json({
      success: true,
      message: `Successfully cleared all ${deleted.count} admin login session(s).`,
      data: { count: deleted.count },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to clear admin sessions.' },
    });
  }
});

// POST /api/admin/update-credentials & POST /api/admin/change-password
const handleUpdateCredentials = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newUsername, newPassword, name } = req.body;
    
    if (!currentPassword) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_PASSWORD', message: 'Current password is required to save changes.' } });
    }

    const token = req.cookies[ADMIN_SESSION_COOKIE];
    const session = await prisma.adminSession.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!session) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session.' } });

    const admin = await prisma.adminUser.findUnique({ where: { id: session.userId } });
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' } });
    }

    const updateData: any = {};

    // Update Username if provided and changed
    if (newUsername && newUsername.trim() && newUsername.trim() !== admin.username) {
      const trimmedUsername = newUsername.trim();
      if (trimmedUsername.length < 3) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_USERNAME', message: 'Username must be at least 3 characters.' } });
      }
      const existingUser = await prisma.adminUser.findUnique({ where: { username: trimmedUsername } });
      if (existingUser && existingUser.id !== admin.id) {
        return res.status(400).json({ success: false, error: { code: 'USERNAME_TAKEN', message: 'Username is already taken by another admin.' } });
      }
      updateData.username = trimmedUsername;
    }

    // Update Password if provided
    if (newPassword && newPassword.trim()) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'New password must be at least 6 characters.' } });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      updateData.mustChangePassword = false;
    }

    // Update Name if provided
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: { code: 'NO_CHANGES', message: 'No credential changes were provided.' } });
    }

    const updatedAdmin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Admin credentials updated successfully.',
      data: {
        username: updatedAdmin.username,
        name: updatedAdmin.name,
      },
    });
  } catch (error: any) {
    console.error('Error updating admin credentials:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update admin credentials.' } });
  }
};

router.post('/update-credentials', requireAdminAuth, handleUpdateCredentials);
router.post('/change-password', requireAdminAuth, handleUpdateCredentials);


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
  const id = req.params.id as string;
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
  const id = req.params.id as string;
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
  const id = req.params.id as string;
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

// PATCH /api/admin/orders/:id/payment-status
router.patch('/orders/:id/payment-status', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { paymentStatus, failureMessage, note } = req.body;

    if (!paymentStatus || !['SUCCESS', 'FAILED', 'PENDING', 'CANCELLED'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Valid payment status is required (SUCCESS, FAILED, PENDING, CANCELLED).' },
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } });
    }

    const failMsg = failureMessage || (paymentStatus === 'FAILED' ? 'Manually marked as FAILED by store admin.' : null);
    const existingPayment = order.payments && order.payments.length > 0 ? order.payments[order.payments.length - 1] : null;

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          paymentStatus,
          failureMessage: failMsg,
          transactionAt: new Date(),
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMode: order.paymentMode,
          paymentMethod: order.paymentMode === 'COD' ? 'COD' : 'CARD',
          paymentType: 'ONE_TIME',
          amount: order.totalAmount,
          currency: order.currency || 'INR',
          paymentStatus,
          failureMessage: failMsg,
          transactionId: `TXN-${order.orderNumber}-MANUAL`,
          transactionAt: new Date(),
        },
      });
    }

    const noteText = note || `Payment status manually updated to ${paymentStatus} by store admin${failMsg ? `: ${failMsg}` : ''}`;

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.orderStatus,
        newStatus: order.orderStatus,
        changedBy: 'admin',
        note: noteText,
      },
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
    });

    return res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}.`,
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Failed to update payment status.' },
    });
  }
});

// ------------------------------------------------------
// Category & Subcategory Taxonomy Management
// ------------------------------------------------------

// GET /api/admin/categories - Fetch complete category hierarchy with product counts
router.get('/categories', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        categories: {
          include: {
            subcategories: {
              include: {
                _count: { select: { products: true } },
              },
              orderBy: { name: 'asc' },
            },
            _count: { select: { products: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, data: departments });
  } catch (error: any) {
    console.error('Error fetching admin categories:', error);
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

// GET /api/admin/products
router.get('/products', requireAdminAuth, async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      category: true,
      subcategory: true,
      productDefinition: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return res.json({ success: true, data: products });
});

// PATCH /api/admin/products/:id
router.patch('/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      brand,
      sku,
      stock,
      price,
      mrp,
      status,
      isFeatured,
      isBestSeller,
      description,
      warrantyInfo,
      specifications,
      requiresInstallation,
      installationDetails,
      imageUrls,
      categoryId,
      subcategoryId,
      categoryName,
      category,
      subcategoryName,
      subcategory,
    } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    }

    let parsedSpecs: string | null | undefined = undefined;
    if (specifications !== undefined) {
      parsedSpecs = typeof specifications === 'object' ? JSON.stringify(specifications) : specifications;
    }

    let targetCategoryId: string | null | undefined = categoryId !== undefined ? (categoryId || null) : undefined;
    let targetSubcategoryId: string | null | undefined = subcategoryId !== undefined ? (subcategoryId || null) : undefined;

    const catInput = (categoryName || category)?.trim();
    const subInput = (subcategoryName || subcategory)?.trim();

    if (catInput) {
      let cat = await prisma.category.findFirst({
        where: { name: { equals: catInput, mode: 'insensitive' } },
      });
      if (!cat) {
        let dept = await prisma.department.findFirst();
        if (!dept) {
          dept = await prisma.department.create({
            data: { name: 'Electronics & Appliances', slug: 'electronics-appliances' },
          });
        }
        const baseCatSlug = catInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const catSlug = `${baseCatSlug}-${Date.now().toString().slice(-4)}`;
        cat = await prisma.category.create({
          data: { name: catInput, slug: catSlug, departmentId: dept.id },
        });
      }
      targetCategoryId = cat.id;

      if (subInput) {
        let sub = await prisma.subcategory.findFirst({
          where: {
            categoryId: cat.id,
            name: { equals: subInput, mode: 'insensitive' },
          },
        });
        if (!sub) {
          const baseSubSlug = subInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const subSlug = `${baseSubSlug}-${Date.now().toString().slice(-4)}`;
          sub = await prisma.subcategory.create({
            data: { name: subInput, slug: subSlug, categoryId: cat.id },
          });
        }
        targetSubcategoryId = sub.id;
      } else if (subcategoryName !== undefined || subcategory !== undefined) {
        targetSubcategoryId = null;
      }
    }

    const effectiveCategoryId = targetCategoryId !== undefined ? targetCategoryId : existingProduct.categoryId;
    const effectiveSubcategoryId = targetSubcategoryId !== undefined ? targetSubcategoryId : existingProduct.subcategoryId;

    let targetProductDefinitionId: string | null | undefined = undefined;

    // Validation: Verify subcategory belongs to category
    if (effectiveSubcategoryId && effectiveCategoryId) {
      const subCheck = await prisma.subcategory.findUnique({
        where: { id: effectiveSubcategoryId },
      });
      if (!subCheck || subCheck.categoryId !== effectiveCategoryId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Selected subcategory does not belong to the selected category', code: 'INVALID_SUBCATEGORY' }
        });
      }
    }

    // Synchronize productDefinitionId pointer with new subcategory
    if (targetCategoryId !== undefined || targetSubcategoryId !== undefined) {
      if (effectiveSubcategoryId) {
        const matchingDef = await prisma.productDefinition.findFirst({
          where: { subcategoryId: effectiveSubcategoryId },
        });
        targetProductDefinitionId = matchingDef ? matchingDef.id : null;
      } else {
        targetProductDefinitionId = null;
      }
    }

    await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        brand: brand !== undefined ? brand.trim() : undefined,
        sku: sku !== undefined ? sku.trim() : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        price: price !== undefined ? Number(price) : undefined,
        mrp: mrp !== undefined ? Number(mrp) : undefined,
        status: status !== undefined ? status : undefined,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        isBestSeller: isBestSeller !== undefined ? Boolean(isBestSeller) : undefined,
        description: description !== undefined ? description : undefined,
        warrantyInfo: warrantyInfo !== undefined ? warrantyInfo : undefined,
        specifications: parsedSpecs !== undefined ? parsedSpecs : undefined,
        requiresInstallation: requiresInstallation !== undefined ? Boolean(requiresInstallation) : undefined,
        installationDetails: installationDetails !== undefined ? installationDetails : undefined,
        categoryId: targetCategoryId,
        subcategoryId: targetSubcategoryId,
        productDefinitionId: targetProductDefinitionId,
      },
    });

    if (Array.isArray(imageUrls)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      const cleanUrls = imageUrls.map((u: string) => String(u).trim()).filter(Boolean);
      if (cleanUrls.length > 0) {
        await prisma.productImage.createMany({
          data: cleanUrls.map((url: string, idx: number) => ({
            productId: id,
            url,
            isPrimary: idx === 0,
            sortOrder: idx,
          })),
        });
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        subcategory: true,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message || 'Failed to update product.' } });
  }
});

// POST /api/admin/products
router.post('/products', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      name,
      brand,
      sku,
      price,
      mrp,
      stock,
      status,
      isFeatured,
      isBestSeller,
      description,
      warrantyInfo,
      imageUrl,
      imageUrls,
      specifications,
      requiresInstallation,
      installationDetails,
      categoryId,
      subcategoryId,
      categoryName,
      category,
      subcategoryName,
      subcategory,
    } = req.body;

    if (!name || !brand || !sku || price === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Product title, brand, SKU, and price are required.' },
      });
    }

    const cleanName = name.trim();
    const cleanBrand = brand.trim();
    const cleanSku = sku.trim();

    const existingSku = await prisma.product.findUnique({ where: { sku: cleanSku } });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        error: { code: 'SKU_EXISTS', message: `SKU ${cleanSku} is already in use by another product.` },
      });
    }

    const slugBase = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

    let parsedSpecs: string | null = null;
    if (specifications) {
      parsedSpecs = typeof specifications === 'object' ? JSON.stringify(specifications) : specifications;
    }

    const imageList: string[] = [];
    if (Array.isArray(imageUrls)) {
      imageList.push(...imageUrls.map((u: string) => String(u).trim()).filter(Boolean));
    } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      imageList.push(imageUrl.trim());
    }

    let targetCategoryId: string | null = categoryId || null;
    let targetSubcategoryId: string | null = subcategoryId || null;

    const catInput = (categoryName || category)?.trim();
    const subInput = (subcategoryName || subcategory)?.trim();

    if (catInput) {
      let cat = await prisma.category.findFirst({
        where: { name: { equals: catInput, mode: 'insensitive' } },
      });
      if (!cat) {
        let dept = await prisma.department.findFirst();
        if (!dept) {
          dept = await prisma.department.create({
            data: { name: 'Electronics & Appliances', slug: 'electronics-appliances' },
          });
        }
        const baseCatSlug = catInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const catSlug = `${baseCatSlug}-${Date.now().toString().slice(-4)}`;
        cat = await prisma.category.create({
          data: { name: catInput, slug: catSlug, departmentId: dept.id },
        });
      }
      targetCategoryId = cat.id;

      if (subInput) {
        let sub = await prisma.subcategory.findFirst({
          where: {
            categoryId: cat.id,
            name: { equals: subInput, mode: 'insensitive' },
          },
        });
        if (!sub) {
          const baseSubSlug = subInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const subSlug = `${baseSubSlug}-${Date.now().toString().slice(-4)}`;
          sub = await prisma.subcategory.create({
            data: { name: subInput, slug: subSlug, categoryId: cat.id },
          });
        }
        targetSubcategoryId = sub.id;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: cleanName,
        slug,
        brand: cleanBrand,
        sku: cleanSku,
        price: Number(price),
        mrp: Number(mrp || price),
        stock: Number(stock || 0),
        status: status || 'ACTIVE',
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        description: description || null,
        warrantyInfo: warrantyInfo || null,
        specifications: parsedSpecs,
        requiresInstallation: Boolean(requiresInstallation),
        installationDetails: installationDetails || null,
        categoryId: targetCategoryId,
        subcategoryId: targetSubcategoryId,
        images: imageList.length > 0
          ? {
              create: imageList.map((url, idx) => ({
                url,
                isPrimary: idx === 0,
                sortOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        subcategory: true,
      },
    });

    return res.json({ success: true, data: product });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message || 'Failed to create product.' } });
  }
});

// POST /api/admin/products/import-excel
router.post('/products/import-excel', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_IMPORT', message: 'No product rows provided in import payload.' },
      });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let ignoredCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i];
      try {
        const name = String(row.name || row['Product Name'] || row.title || row['Title'] || row.productType || row['Product / Product Type'] || '').trim();
        const brand = String(row.brand || row['Brand'] || row.exampleBrands || row['Example Brands'] || 'Ravi Vision Store').trim();
        let sku = String(row.sku || row['SKU'] || row['SKU / Product Code'] || '').trim();
        const priceNum = Number(row.price || row['Selling Price (INR)'] || row['Sale Price'] || row['Price'] || row['Selling Price'] || 0);
        const mrpNum = Number(row.mrp || row['MRP (INR)'] || row['MRP'] || priceNum || 0);
        const stockNum = Number(row.stock || row['Stock'] || row['Stock Level'] || 10);
        const statusVal = String(row.status || row['Status'] || row['Stock Status'] || 'ACTIVE').toUpperCase().trim();
        const desc = row.description || row['Description'] || row['Product Description'] || null;
        const warranty = row.warrantyInfo || row['Warranty'] || row['Warranty Details'] || '1 Year Brand Manufacturer Warranty';
        const reqInst = Boolean(
          row.requiresInstallation ||
          row['Requires Installation'] === 'Yes' ||
          row['Requires Installation (Yes/No)'] === 'Yes' ||
          row['Requires Installation'] === true
        );
        const instDetails = row.installationDetails || row['Installation Details'] || (reqInst ? 'Local technician installation provided upon delivery.' : null);

        if (!name || priceNum <= 0) {
          ignoredCount++;
          continue;
        }

        if (!sku) {
          const brandCode = brand.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
          sku = `RV-${brandCode}-${Date.now().toString().slice(-4)}${i + 1}`;
        }

        const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slug = `${slugBase}-${Date.now().toString().slice(-4)}${i + 1}`;

        // Parse images
        const imageList: string[] = [];
        const rawImages = row.imageUrls || row['Image URLs'] || row['Image URLs (comma separated)'] || row.imageUrl || row['Image URL'];
        if (Array.isArray(rawImages)) {
          imageList.push(...rawImages.map((u: any) => String(u).trim()).filter(Boolean));
        } else if (typeof rawImages === 'string' && rawImages.trim()) {
          imageList.push(...rawImages.split(',').map(u => u.trim()).filter(Boolean));
        }

        // Parse specifications
        let specsJson: string | null = null;
        const rawSpecs = row.specifications || row['Specifications'] || row['Specifications (Key:Value pairs)'] || row.keyAttributes || row['Key Selling Attributes'];
        if (typeof rawSpecs === 'object' && rawSpecs !== null) {
          specsJson = JSON.stringify(rawSpecs);
        } else if (typeof rawSpecs === 'string' && rawSpecs.trim()) {
          const specMap: Record<string, string> = {};
          if (rawSpecs.includes(':') || rawSpecs.includes('=')) {
            const pairs = rawSpecs.split(/[,;\n]/);
            pairs.forEach(p => {
              const parts = p.split(/[:=]/);
              if (parts.length >= 2) {
                specMap[parts[0].trim()] = parts.slice(1).join(':').trim();
              }
            });
          } else {
            const specKeys = rawSpecs.split(',').map(k => k.trim());
            specKeys.forEach((key, idx) => {
              if (key) specMap[key] = `Standard Grade (${idx + 1})`;
            });
          }
          if (Object.keys(specMap).length > 0) {
            specsJson = JSON.stringify(specMap);
          }
        }

        // Category & Subcategory resolution
        const categoryName = String(row.category || row['Category'] || row['Category Name'] || row.categoryName || '').trim();
        const subcategoryName = String(row.subcategory || row['Subcategory'] || row['Subcategory Name'] || row.subcategoryName || '').trim();

        let matchedCategoryId: string | null = null;
        let matchedSubcategoryId: string | null = null;

        if (categoryName) {
          let cat = await prisma.category.findFirst({
            where: { name: { equals: categoryName, mode: 'insensitive' } },
          });

          if (!cat) {
            let dept = await prisma.department.findFirst();
            if (!dept) {
              dept = await prisma.department.create({
                data: { name: 'Electronics & Appliances', slug: 'electronics-appliances' },
              });
            }
            const catSlug = `${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
            cat = await prisma.category.create({
              data: { name: categoryName, slug: catSlug, departmentId: dept.id },
            });
          }
          matchedCategoryId = cat.id;

          if (subcategoryName) {
            let sub = await prisma.subcategory.findFirst({
              where: {
                categoryId: cat.id,
                name: { equals: subcategoryName, mode: 'insensitive' },
              },
            });
            if (!sub) {
              const subSlug = `${subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
              sub = await prisma.subcategory.create({
                data: { name: subcategoryName, slug: subSlug, categoryId: cat.id },
              });
            }
            matchedSubcategoryId = sub.id;
          }
        }

        const existingProduct = await prisma.product.findUnique({ where: { sku } });

        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name,
              brand,
              price: priceNum,
              mrp: mrpNum > 0 ? mrpNum : priceNum,
              stock: stockNum,
              status: statusVal === 'ACTIVE' || statusVal === 'DRAFT' || statusVal === 'OUT_OF_STOCK' || statusVal === 'INACTIVE' ? statusVal : 'ACTIVE',
              description: desc || existingProduct.description,
              warrantyInfo: warranty || existingProduct.warrantyInfo,
              requiresInstallation: reqInst,
              installationDetails: instDetails,
              specifications: specsJson || existingProduct.specifications,
              categoryId: matchedCategoryId || existingProduct.categoryId,
              subcategoryId: matchedSubcategoryId || existingProduct.subcategoryId,
            },
          });

          if (imageList.length > 0) {
            await prisma.productImage.deleteMany({ where: { productId: existingProduct.id } });
            await prisma.productImage.createMany({
              data: imageList.map((url, idx) => ({
                productId: existingProduct.id,
                url,
                isPrimary: idx === 0,
                sortOrder: idx,
              })),
            });
          }
          updatedCount++;
        } else {
          const newProduct = await prisma.product.create({
            data: {
              name,
              slug,
              brand,
              sku,
              price: priceNum,
              mrp: mrpNum > 0 ? mrpNum : priceNum,
              stock: stockNum,
              status: statusVal === 'ACTIVE' || statusVal === 'DRAFT' || statusVal === 'OUT_OF_STOCK' || statusVal === 'INACTIVE' ? statusVal : 'ACTIVE',
              description: desc,
              warrantyInfo: warranty,
              requiresInstallation: reqInst,
              installationDetails: instDetails,
              specifications: specsJson,
              categoryId: matchedCategoryId,
              subcategoryId: matchedSubcategoryId,
              images: imageList.length > 0
                ? {
                    create: imageList.map((url, idx) => ({
                      url,
                      isPrimary: idx === 0,
                      sortOrder: idx,
                    })),
                  }
                : undefined,
            },
          });
          createdCount++;
        }
      } catch (rowErr: any) {
        errors.push(`Row ${i + 1}: ${rowErr.message || 'Row import error'}`);
      }
    }

    return res.json({
      success: true,
      message: `Excel Catalog Import Complete: ${createdCount} created, ${updatedCount} updated.`,
      data: {
        createdCount,
        updatedCount,
        ignoredCount,
        totalProcessed: products.length,
        errors,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'IMPORT_FAILED', message: error.message || 'Excel import processing failed.' },
    });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    }

    await prisma.product.delete({ where: { id } });
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message || 'Failed to delete product.' } });
  }
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
