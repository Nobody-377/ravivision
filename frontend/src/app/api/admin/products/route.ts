import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/session';

// GET /api/admin/products - List all products for admin
export async function GET(request: NextRequest) {
  const auth = await getAdminSession();
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';

  const whereClause: any = {};
  if (filter === 'active') whereClause.status = 'ACTIVE';
  if (filter === 'draft') whereClause.status = 'DRAFT';
  if (filter === 'out_of_stock') whereClause.stock = 0;
  if (filter === 'demo') whereClause.isDemoData = true;

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      productDefinition: {
        include: { subcategory: { include: { category: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    sku: p.sku,
    price: p.price.toNumber(),
    mrp: p.mrp.toNumber(),
    stock: p.stock,
    status: p.status,
    isDemoData: p.isDemoData,
    requiresInstallation: p.requiresInstallation,
    categoryName: p.productDefinition?.subcategory?.category?.name || 'General',
  }));

  return NextResponse.json({ success: true, data: formatted });
}

// PUT /api/admin/products - Update product price, stock, or status
export async function PUT(request: NextRequest) {
  const auth = await getAdminSession();
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, price, mrp, stock, status, isDemoData } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Product ID required.' } }, { status: 400 });
    }

    const updateData: any = {};
    if (price !== undefined) updateData.price = Number(price);
    if (mrp !== undefined) updateData.mrp = Number(mrp);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (status !== undefined) updateData.status = status;
    if (isDemoData !== undefined) updateData.isDemoData = isDemoData;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated, message: 'Product updated successfully.' });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update product.' } }, { status: 500 });
  }
}
