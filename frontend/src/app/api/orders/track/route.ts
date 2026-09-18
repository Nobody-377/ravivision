import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSession } from '@/lib/customer-session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumberParam = searchParams.get('orderNumber')?.trim();
    const mobileNumberParam = searchParams.get('mobileNumber')?.trim();

    const loggedInCustomer = await getCustomerSession();

    if (!orderNumberParam && !loggedInCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_INPUT', message: 'Please enter your Order Number and Mobile Number.' },
        },
        { status: 400 }
      );
    }

    let whereClause: any = {};

    if (orderNumberParam && mobileNumberParam) {
      const cleanMobile = mobileNumberParam.replace(/\D/g, '');
      whereClause = {
        orderNumber: { equals: orderNumberParam, mode: 'insensitive' },
        mobileNumber: { contains: cleanMobile },
      };
    } else if (orderNumberParam) {
      whereClause = {
        orderNumber: { equals: orderNumberParam, mode: 'insensitive' },
      };
      if (loggedInCustomer) {
        whereClause.mobileNumber = { contains: loggedInCustomer.mobileNumber };
      }
    } else if (loggedInCustomer) {
      // Return latest order for logged in customer
      whereClause = {
        mobileNumber: { contains: loggedInCustomer.mobileNumber },
      };
    }

    const order = await prisma.order.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'No matching order found. Please check your Order Number and Mobile Number.',
          },
        },
        { status: 404 }
      );
    }

    // Extract milestone timestamps from statusHistory
    const milestoneTimestamps: Record<string, string | null> = {
      PLACED: order.createdAt.toISOString(),
      CONFIRMED: null,
      PACKED: null,
      OUT_FOR_DELIVERY: null,
      DELIVERED: null,
      CANCELLED: null,
    };

    let latestNote: string | null = null;

    order.statusHistory.forEach((sh) => {
      if (sh.newStatus) {
        milestoneTimestamps[sh.newStatus] = sh.createdAt.toISOString();
        if (sh.note) latestNote = sh.note;
      }
    });

    // Milestone completion status map
    const milestoneSteps = [
      {
        key: 'PLACED',
        label: 'Order Placed',
        description: 'Successful order submission',
        completed: true,
        timestamp: milestoneTimestamps['PLACED'],
      },
      {
        key: 'CONFIRMED',
        label: 'Order Confirmed',
        description: 'Verified & accepted by store team',
        completed: Boolean(milestoneTimestamps['CONFIRMED'] || ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)),
        timestamp: milestoneTimestamps['CONFIRMED'],
      },
      {
        key: 'PACKED',
        label: 'Packed & Prepared',
        description: 'Inventory reserved & packed at store',
        completed: Boolean(milestoneTimestamps['PACKED'] || ['PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)),
        timestamp: milestoneTimestamps['PACKED'],
      },
      {
        key: 'OUT_FOR_DELIVERY',
        label: 'Out for Local Delivery',
        description: 'Dispatched for local area handover',
        completed: Boolean(milestoneTimestamps['OUT_FOR_DELIVERY'] || ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)),
        timestamp: milestoneTimestamps['OUT_FOR_DELIVERY'],
      },
      {
        key: 'DELIVERED',
        label: 'Delivered',
        description: 'Handed over at customer address',
        completed: Boolean(milestoneTimestamps['DELIVERED'] || order.orderStatus === 'DELIVERED'),
        timestamp: milestoneTimestamps['DELIVERED'],
      },
    ];

    const isCancelled = order.orderStatus === 'CANCELLED';

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        isCancelled,
        customerName: order.customerName,
        mobileNumber: order.mobileNumber,
        customerEmail: order.customerEmail,
        address: order.address,
        landmark: order.landmark,
        pincode: order.pincode,
        city: order.city,
        state: order.state,
        subtotal: order.subtotal.toNumber(),
        deliveryCharge: order.deliveryCharge.toNumber(),
        totalAmount: order.totalAmount.toNumber(),
        paymentMode: order.paymentMode,
        paymentStatus: order.payments[0]?.paymentStatus || (order.paymentMode === 'COD' ? 'PENDING' : 'SUCCESS'),
        createdAt: order.createdAt.toISOString(),
        milestones: milestoneSteps,
        history: order.statusHistory.map((sh) => ({
          status: sh.newStatus,
          note: sh.note,
          timestamp: sh.createdAt.toISOString(),
        })),
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          brand: item.brand,
          sku: item.sku,
          unitPrice: item.unitPrice.toNumber(),
          quantity: item.quantity,
          totalPrice: item.totalPrice.toNumber(),
        })),
        latestNote,
        storePhone: process.env.STORE_PHONE || '9631410611',
      },
    });
  } catch (error: any) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Unable to track order at this time.' } },
      { status: 500 }
    );
  }
}
