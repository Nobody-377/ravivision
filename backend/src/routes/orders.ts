import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/orders/track - Track order by orderNumber & mobileNumber or customer session
router.get('/track', async (req: Request, res: Response) => {
  try {
    const orderNumberParam = (req.query.orderNumber as string)?.trim();
    const mobileNumberParam = (req.query.mobileNumber as string)?.trim();

    const sessionToken = req.cookies['ravi_customer_session'] || req.headers.authorization?.replace('Bearer ', '');
    let loggedInCustomer = null;
    if (sessionToken) {
      loggedInCustomer = await prisma.customer.findFirst({
        where: { OR: [{ id: sessionToken }, { mobileNumber: sessionToken }] },
      });
    }

    if (!orderNumberParam && !loggedInCustomer && !mobileNumberParam) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_INPUT', message: 'Please enter your Order Number and Mobile Number.' },
      });
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
      whereClause = {
        mobileNumber: { contains: loggedInCustomer.mobileNumber },
      };
    } else if (mobileNumberParam) {
      const cleanMobile = mobileNumberParam.replace(/\D/g, '');
      whereClause = {
        mobileNumber: { contains: cleanMobile },
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: orderNumberParam ? 1 : 20,
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        customer: true,
      },
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'No matching order found. Please check your order number and mobile number.',
        },
      });
    }

    const formattedOrders = orders.map((order: any) => {
      const latestPayment = order.payments[0];
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        mobileNumber: order.mobileNumber,
        address: order.address,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
        subtotal: Number(order.subtotal),
        deliveryCharge: Number(order.deliveryCharge),
        totalAmount: Number(order.totalAmount),
        paymentMode: order.paymentMode,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        items: order.items.map((item: any) => ({
          id: item.id,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        latestPayment: latestPayment
          ? {
              id: latestPayment.id,
              paymentStatus: latestPayment.paymentStatus,
              amount: Number(latestPayment.amount),
              transactionId: latestPayment.transactionId,
              failureMessage: latestPayment.failureMessage,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      data: orderNumberParam ? formattedOrders[0] : formattedOrders,
    });
  } catch (error: any) {
    console.error('Error tracking order:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve order tracking information.' },
    });
  }
});

export default router;
