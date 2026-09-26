import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getStoreConfig } from '@/lib/store-config';

const ADMIN_SESSION_COOKIE = 'ravi_admin_token';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join('/');

  // GET /api/admin/auth/me
  if (route === 'auth/me') {
    const session = await verifyAdminAuth(req);
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    }
    const admin = await prisma.adminUser.findUnique({ where: { id: session.userId } });
    if (!admin) {
      return NextResponse.json({ success: false, error: { code: 'USER_NOT_FOUND' } }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      data: { username: admin.username, name: admin.name },
    });
  }

  // GET /api/admin/delivery
  if (route === 'delivery') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const zones = await prisma.deliveryZone.findMany({ orderBy: { pincode: 'asc' } });
    return NextResponse.json({ success: true, data: zones });
  }

  // GET /api/admin/orders
  if (route === 'orders') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const orders = await prisma.order.findMany({
      include: { items: true, payments: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: orders });
  }

  // GET /api/admin/products
  if (route === 'products') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const products = await prisma.product.findMany({
      include: { images: true, category: true, subcategory: true },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: products });
  }

  // GET /api/admin/customers
  if (route === 'customers') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const customers = await prisma.customer.findMany({
      include: { orders: { select: { id: true, totalAmount: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const data = customers.map((c) => ({
      id: c.id,
      name: c.name,
      mobileNumber: c.mobileNumber,
      pincode: c.pincode,
      createdAt: c.createdAt,
      ordersCount: c.orders.length,
      totalSpent: c.orders.reduce((acc, o) => acc + o.totalAmount.toNumber(), 0),
    }));

    return NextResponse.json({ success: true, data });
  }

  // GET /api/admin/settings
  if (route === 'settings') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const config = await getStoreConfig();
    return NextResponse.json({ success: true, data: config });
  }

  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join('/');
  const body = await req.json().catch(() => ({}));

  // POST /api/admin/auth/login
  if (route === 'auth/login') {
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Username and password required.' } }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { username: String(username).trim() } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid admin credentials.' } }, { status: 401 });
    }

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.adminSession.create({
      data: { tokenHash, userId: admin.id, expiresAt },
    });

    const res = NextResponse.json({
      success: true,
      data: { username: admin.username, name: admin.name, mustChangePassword: admin.mustChangePassword },
    });

    res.cookies.set(ADMIN_SESSION_COOKIE, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  }

  // POST /api/admin/auth/logout
  if (route === 'auth/logout') {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (token) {
      await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    }
    const res = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    res.cookies.delete(ADMIN_SESSION_COOKIE);
    return res;
  }

  // POST /api/admin/auth/clear-all-sessions
  if (route === 'auth/clear-all-sessions') {
    const deleted = await prisma.adminSession.deleteMany({});
    const res = NextResponse.json({
      success: true,
      message: `Successfully cleared all ${deleted.count} admin session(s).`,
      data: { count: deleted.count },
    });
    res.cookies.delete(ADMIN_SESSION_COOKIE);
    return res;
  }

  // POST /api/admin/update-credentials or change-password
  if (route === 'update-credentials' || route === 'change-password') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const { currentPassword, newUsername, newPassword, name } = body;
    if (!currentPassword) {
      return NextResponse.json({ success: false, error: { code: 'MISSING_PASSWORD', message: 'Current password is required.' } }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: session.userId } });
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' } }, { status: 400 });
    }

    const updateData: any = {};
    if (newUsername && newUsername.trim() && newUsername.trim() !== admin.username) {
      updateData.username = newUsername.trim();
    }
    if (newPassword && newPassword.trim()) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
      updateData.mustChangePassword = false;
    }
    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    const updatedAdmin = await prisma.adminUser.update({
      where: { id: admin.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin credentials updated successfully.',
      data: { username: updatedAdmin.username, name: updatedAdmin.name },
    });
  }

  // POST /api/admin/delivery
  if (route === 'delivery') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const { pincode, area, city, active, oneDayDelivery, deliveryCharge } = body;
    const zone = await prisma.deliveryZone.create({
      data: {
        pincode: String(pincode).trim(),
        area: String(area).trim(),
        city: String(city).trim(),
        active: Boolean(active),
        oneDayDelivery: Boolean(oneDayDelivery),
        deliveryCharge: Number(deliveryCharge || 0),
      },
    });
    return NextResponse.json({ success: true, data: zone });
  }

  // POST /api/admin/products
  if (route === 'products') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const { name, brand, sku, price, mrp, stock, status, isFeatured, isBestSeller, description, warrantyInfo, imageUrl, imageUrls, specifications, requiresInstallation, installationDetails, categoryId, subcategoryId, categoryName, category, subcategoryName, subcategory } = body;
    if (!name || !brand || !sku || price === undefined) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Product title, brand, SKU, and price are required.' } }, { status: 400 });
    }

    const cleanName = String(name).trim();
    const cleanBrand = String(brand).trim();
    const cleanSku = String(sku).trim();

    const existingSku = await prisma.product.findUnique({ where: { sku: cleanSku } });
    if (existingSku) {
      return NextResponse.json({ success: false, error: { code: 'SKU_EXISTS', message: `SKU ${cleanSku} is already in use.` } }, { status: 400 });
    }

    const slugBase = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

    let parsedSpecs: string | null = null;
    if (specifications) {
      parsedSpecs = typeof specifications === 'object' ? JSON.stringify(specifications) : String(specifications);
    }

    const imageList: string[] = [];
    if (Array.isArray(imageUrls)) {
      imageList.push(...imageUrls.map((u: any) => String(u).trim()).filter(Boolean));
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
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: true, subcategory: true },
    });

    return NextResponse.json({ success: true, data: product });
  }

  // POST /api/admin/products/import-excel
  if (route === 'products/import-excel') {
    const session = await verifyAdminAuth(req);
    if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

    const { products } = body;
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, error: { code: 'EMPTY_IMPORT', message: 'No product rows provided.' } }, { status: 400 });
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

        const catInput = String(row.category || row['Category'] || row.categoryName || row['Category Name'] || '').trim();
        const subInput = String(row.subcategory || row['Subcategory'] || row.subcategoryName || row['Subcategory Name'] || '').trim();
        const isBestSellerVal = String(row.isBestSeller || row['Best Seller'] || row['Best Seller (Yes/No)'] || '').toLowerCase().includes('yes') || String(row.isBestSeller) === 'true';
        const isFeaturedVal = String(row.isFeatured || row['Featured'] || row['Featured (Yes/No)'] || '').toLowerCase().includes('yes') || String(row.isFeatured) === 'true';
        const descriptionVal = String(row.description || row['Description'] || '').trim();
        const warrantyInfoVal = String(row.warrantyInfo || row['Warranty'] || row['Warranty Info'] || '1 Year Brand Warranty').trim();
        const requiresInstallVal = String(row.requiresInstallation || row['Requires Installation'] || row['Requires Installation (Yes/No)'] || '').toLowerCase().includes('yes') || String(row.requiresInstallation) === 'true';
        const installDetailsVal = String(row.installationDetails || row['Installation Details'] || '').trim();

        // Image URLs parsing
        const rawImages = row.imageUrls || row['Image URLs'] || row['Image URLs (comma separated)'] || row.image || row['Image'];
        const imageList: string[] = [];
        if (Array.isArray(rawImages)) {
          imageList.push(...rawImages.map((u: any) => String(u).trim()).filter(Boolean));
        } else if (typeof rawImages === 'string' && rawImages.trim()) {
          imageList.push(...rawImages.split(',').map((u: string) => u.trim()).filter(Boolean));
        }

        // Specifications parsing
        const rawSpecs = row.specifications || row['Specifications'] || row['Specifications (Key:Value pairs)'];
        let specsJson: string | null = null;
        if (typeof rawSpecs === 'object' && rawSpecs !== null) {
          specsJson = JSON.stringify(rawSpecs);
        } else if (typeof rawSpecs === 'string' && rawSpecs.trim()) {
          if (rawSpecs.trim().startsWith('{')) {
            specsJson = rawSpecs.trim();
          } else {
            const specMap: Record<string, string> = {};
            rawSpecs.split(',').forEach((pairStr: string) => {
              const parts = pairStr.split(':');
              if (parts.length >= 2) {
                specMap[parts[0].trim()] = parts.slice(1).join(':').trim();
              }
            });
            if (Object.keys(specMap).length > 0) {
              specsJson = JSON.stringify(specMap);
            }
          }
        }

        // Category & Subcategory resolution
        let targetCategoryId: string | null = null;
        let targetSubcategoryId: string | null = null;

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
              isBestSeller: isBestSellerVal,
              isFeatured: isFeaturedVal,
              description: descriptionVal || undefined,
              warrantyInfo: warrantyInfoVal,
              requiresInstallation: requiresInstallVal,
              installationDetails: installDetailsVal || undefined,
              specifications: specsJson || undefined,
              categoryId: targetCategoryId || undefined,
              subcategoryId: targetSubcategoryId || undefined,
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
          const newProd = await prisma.product.create({
            data: {
              name,
              slug,
              brand,
              sku,
              price: priceNum,
              mrp: mrpNum > 0 ? mrpNum : priceNum,
              stock: stockNum,
              status: statusVal === 'ACTIVE' || statusVal === 'DRAFT' || statusVal === 'OUT_OF_STOCK' || statusVal === 'INACTIVE' ? statusVal : 'ACTIVE',
              isBestSeller: isBestSellerVal,
              isFeatured: isFeaturedVal,
              description: descriptionVal || undefined,
              warrantyInfo: warrantyInfoVal,
              requiresInstallation: requiresInstallVal,
              installationDetails: installDetailsVal || undefined,
              specifications: specsJson || undefined,
              categoryId: targetCategoryId,
              subcategoryId: targetSubcategoryId,
            },
          });

          if (imageList.length > 0) {
            await prisma.productImage.createMany({
              data: imageList.map((url, idx) => ({
                productId: newProd.id,
                url,
                isPrimary: idx === 0,
                sortOrder: idx,
              })),
            });
          }
          createdCount++;
        }
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Excel Import Complete: ${createdCount} created, ${updatedCount} updated.`,
      data: { createdCount, updatedCount, ignoredCount, totalProcessed: products.length, errors },
    });
  }

  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join('/');
  const body = await req.json().catch(() => ({}));
  const session = await verifyAdminAuth(req);
  if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // PUT /api/admin/orders
  if (route === 'orders') {
    const { orderId, orderStatus, note } = body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

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

    return NextResponse.json({ success: true, data: updated });
  }

  // PUT /api/admin/settings
  if (route === 'settings') {
    const fields = ['storeName', 'phone', 'whatsapp', 'email', 'address', 'city', 'state', 'pincode', 'openingHours', 'codEnabled'];
    for (const field of fields) {
      if (body[field] !== undefined) {
        await prisma.storeSetting.upsert({
          where: { key: field },
          update: { value: String(body[field]).trim() },
          create: { key: field, value: String(body[field]).trim() },
        });
      }
    }

    const updatedConfig = await getStoreConfig();
    return NextResponse.json({ success: true, data: updatedConfig });
  }

  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const session = await verifyAdminAuth(req);
  if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  // PATCH /api/admin/delivery/:id
  if (path[0] === 'delivery' && path.length === 2) {
    const id = path[1];
    const { pincode, area, city, active, oneDayDelivery, deliveryCharge, notes } = body;
    const updated = await prisma.deliveryZone.update({
      where: { id },
      data: {
        pincode: pincode !== undefined ? String(pincode).trim() : undefined,
        area: area !== undefined ? String(area).trim() : undefined,
        city: city !== undefined ? String(city).trim() : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
        oneDayDelivery: oneDayDelivery !== undefined ? Boolean(oneDayDelivery) : undefined,
        deliveryCharge: deliveryCharge !== undefined ? Number(deliveryCharge) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  }

  // PATCH /api/admin/orders/:id/status
  if (path[0] === 'orders' && path.length === 3 && path[2] === 'status') {
    const id = path[1];
    const { status, note } = body;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

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
    return NextResponse.json({ success: true, data: updated });
  }

  // PATCH /api/admin/orders/:id/payment-status
  if (path[0] === 'orders' && path.length === 3 && path[2] === 'payment-status') {
    const id = path[1];
    const { paymentStatus, failureMessage, note } = body;

    const order = await prisma.order.findUnique({ where: { id }, include: { payments: true } });
    if (!order) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

    const failMsg = failureMessage || (paymentStatus === 'FAILED' ? 'Manually marked as FAILED by admin.' : null);
    const existingPayment = order.payments && order.payments.length > 0 ? order.payments[order.payments.length - 1] : null;

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { paymentStatus, failureMessage: failMsg, transactionAt: new Date() },
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

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.orderStatus,
        newStatus: order.orderStatus,
        changedBy: 'admin',
        note: note || `Payment status updated to ${paymentStatus}.`,
      },
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
    });

    return NextResponse.json({ success: true, message: `Payment status updated to ${paymentStatus}.`, data: updatedOrder });
  }

  // PATCH /api/admin/products/:id
  if (path[0] === 'products' && path.length === 2) {
    const id = path[1];
    const { name, brand, sku, stock, price, mrp, status, isFeatured, isBestSeller, description, warrantyInfo, specifications, requiresInstallation, installationDetails, imageUrls, categoryId, subcategoryId, categoryName, category, subcategoryName, subcategory } = body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
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

    await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        brand: brand !== undefined ? String(brand).trim() : undefined,
        sku: sku !== undefined ? String(sku).trim() : undefined,
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
      include: { images: { orderBy: { sortOrder: 'asc' } }, category: true, subcategory: true },
    });

    return NextResponse.json({ success: true, data: updated });
  }

  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const session = await verifyAdminAuth(req);
  if (!session) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // DELETE /api/admin/delivery/:id
  if (path[0] === 'delivery' && path.length === 2) {
    const id = path[1];
    await prisma.deliveryZone.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Delivery zone deleted.' });
  }

  // DELETE /api/admin/products/:id
  if (path[0] === 'products' && path.length === 2) {
    const id = path[1];
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Product deleted.' });
  }

  return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
}
