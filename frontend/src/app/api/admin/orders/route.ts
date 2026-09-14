import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/session';

// GET /api/admin/orders - List all orders with items & status history
export async function GET(request: NextRequest) {
  const auth = await getAdminSession();
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';

  const whereClause: any = {};
  if (search) {
    whereClause.OR = [
      { orderNumber: { contains: search } },
      { customerName: { contains: search } },
      { customerPhone: { contains: search } },
    ];
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    shippingAddress: o.shippingAddress,
    landmark: o.landmark,
    city: o.city,
    state: o.state,
    pincode: o.pincode,
    subtotal: o.subtotal.toNumber(),
    deliveryCharge: o.deliveryCharge.toNumber(),
    totalAmount: o.totalAmount.toNumber(),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    razorpayOrderId: o.razorpayOrderId,
    razorpayPaymentId: o.razorpayPaymentId,
    createdAt: o.createdAt,
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      brand: i.brand,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toNumber(),
      totalPrice: i.totalPrice.toNumber(),
    })),
    statusHistory: o.statusHistory.map((h) => ({
      id: h.id,
      previousStatus: h.previousStatus,
      newStatus: h.newStatus,
      changedBy: h.changedBy,
      note: h.note,
      createdAt: h.createdAt,
    })),
  }));

  return NextResponse.json({ success: true, data: formatted });
}

// PUT /api/admin/orders - Update order status & log transition history
export async function PUT(request: NextRequest) {
  const auth = await getAdminSession();
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, newStatus, note, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Order ID is required.' } }, { status: 400 });
    }

    const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } }, { status: 404 });
    }

    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      PLACED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['PACKED', 'CANCELLED'],
      PACKED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (newStatus && newStatus !== currentOrder.orderStatus) {
      const allowed = ALLOWED_TRANSITIONS[currentOrder.orderStatus] || [];
      if (!allowed.includes(newStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_TRANSITION',
              message: `Cannot transition order status from ${currentOrder.orderStatus} to ${newStatus}.`,
            },
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      if (newStatus && newStatus !== currentOrder.orderStatus) {
        updateData.orderStatus = newStatus;
        updateData.statusHistory = {
          create: {
            previousStatus: currentOrder.orderStatus,
            newStatus,
            changedBy: auth.user.username,
            note: note || `Order status updated to ${newStatus} by store admin.`,
          },
        };

        // Restore inventory if order cancelled before delivery
        if (newStatus === 'CANCELLED' && currentOrder.orderStatus !== 'DELIVERED') {
          const orderItems = await tx.orderItem.findMany({ where: { orderId } });
          for (const item of orderItems) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              }).catch(() => {});
            }
          }
        }
      }

      return await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });
    });

    return NextResponse.json({ success: true, data: updated, message: 'Order status updated successfully.' });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update order status.' } }, { status: 500 });
  }
}
