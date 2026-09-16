import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getRazorpayServer, isRazorpayConfigured, verifyRazorpaySignature } from '../lib/razorpay.js';
import { isValidPhone, isValidPincode, sanitizeString } from '../lib/sanitize.js';

const router = Router();
const CART_COOKIE_NAME = 'ravi_cart_session';

// POST /api/checkout/razorpay/create-order
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    if (!isRazorpayConfigured()) {
      console.error('[Razorpay Error]: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables.');
      return res.status(500).json({
        success: false,
        error: {
          code: 'RAZORPAY_NOT_CONFIGURED',
          message: 'Razorpay environment variables (NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing on the server.',
        },
      });
    }

    const razorpay = getRazorpayServer();
    if (!razorpay) {
      console.error('[Razorpay Error]: Failed to initialize Razorpay SDK client.');
      return res.status(500).json({
        success: false,
        error: { code: 'RAZORPAY_INIT_FAILED', message: 'Failed to initialize Razorpay client.' },
      });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      landmark,
      city,
      state,
      pincode,
      items,
      checkoutSessionId,
    } = req.body;

    const sessionCookie = req.cookies[CART_COOKIE_NAME];
    const cleanCheckoutSessionId = sanitizeString(checkoutSessionId || sessionCookie || '');

    if (!cleanCheckoutSessionId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_SESSION', message: 'Checkout session ID is required.' },
      });
    }

    // 1. Backend Protection / Idempotency Check
    const paidOrder = await prisma.order.findFirst({
      where: {
        checkoutSessionId: cleanCheckoutSessionId,
        payments: {
          some: { paymentStatus: 'SUCCESS' },
        },
      },
    });

    if (paidOrder) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_ALREADY_PAID',
          message: 'This order has already been paid and completed.',
        },
      });
    }

    const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
    const activePendingOrder = await prisma.order.findFirst({
      where: {
        checkoutSessionId: cleanCheckoutSessionId,
        paymentMode: 'ONLINE',
        createdAt: { gte: twentySecondsAgo },
      },
      orderBy: { createdAt: 'desc' },
      include: { payments: true },
    });

    if (activePendingOrder && activePendingOrder.razorpayOrderId) {
      console.log(`[Razorpay Create-Order] Reusing active payment attempt (Order: ${activePendingOrder.orderNumber}) for session: ${cleanCheckoutSessionId}`);
      return res.json({
        success: true,
        data: {
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          razorpayOrder: {
            id: activePendingOrder.razorpayOrderId,
            amount: Math.round(Number(activePendingOrder.totalAmount) * 100),
            currency: 'INR',
          },
          orderNumber: activePendingOrder.orderNumber,
          totalAmount: Number(activePendingOrder.totalAmount),
          isReused: true,
        },
      });
    }

    // 2. Input Sanitization & Validation
    const cleanName = sanitizeString(customerName || '');
    const cleanPhone = sanitizeString(customerPhone || '');
    const cleanEmail = customerEmail ? sanitizeString(customerEmail) : null;
    const cleanAddress = sanitizeString(shippingAddress || '');
    const cleanLandmark = landmark ? sanitizeString(landmark) : null;
    const cleanCity = sanitizeString(city || 'Local Area');
    const cleanState = sanitizeString(state || 'State');
    const cleanPincode = sanitizeString(pincode || '');

    if (!cleanName || !cleanPhone || !cleanAddress || !cleanPincode) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Customer name, phone, shipping address, and pincode are required.' },
      });
    }

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit Indian mobile number.' },
      });
    }

    if (!isValidPincode(cleanPincode)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PINCODE', message: 'Please enter a valid 6-digit Indian postal pincode.' },
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CART', message: 'Cart items are required to create an order.' },
      });
    }

    // 3. Validate Pincode Delivery Serviceability & Fee
    const zone = await prisma.deliveryZone.findUnique({
      where: { pincode: cleanPincode },
    });

    if (!zone || !zone.active) {
      return res.status(400).json({
        success: false,
        error: { code: 'UNSERVICEABLE_PINCODE', message: `Delivery is currently unavailable for pincode ${cleanPincode}.` },
      });
    }

    const deliveryFee = Number(zone.deliveryCharge || 0);

    // 4. Fetch products directly from DB & calculate prices server-side
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    if (productIds.length !== items.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ITEMS', message: 'One or more items are missing valid product IDs.' },
      });
    }

    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let subtotal = 0;
    const validatedItems: { product: any; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    for (const item of items) {
      const dbProd = dbProducts.find((p) => p.id === item.productId);
      if (!dbProd) {
        return res.status(400).json({
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: `Product was not found.` },
        });
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_QUANTITY', message: `Invalid quantity for ${dbProd.name}.` },
        });
      }

      if (dbProd.stock < qty) {
        return res.status(400).json({
          success: false,
          error: { code: 'INSUFFICIENT_STOCK', message: `Only ${dbProd.stock} units of ${dbProd.name} available in stock.` },
        });
      }

      const price = Number(dbProd.price);
      const lineTotal = price * qty;
      subtotal += lineTotal;

      validatedItems.push({
        product: dbProd,
        quantity: qty,
        unitPrice: price,
        totalPrice: lineTotal,
      });
    }

    const totalAmount = subtotal + deliveryFee;
    const amountInPaise = Math.round(totalAmount * 100);
    const orderNumber = `RV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        customerName: cleanName,
        customerPhone: cleanPhone,
        pincode: cleanPincode,
      },
    });

    const transactionId = `TXN-${orderNumber}`;

    await prisma.order.create({
      data: {
        orderNumber,
        customerName: cleanName,
        mobileNumber: cleanPhone,
        customerEmail: cleanEmail,
        address: cleanAddress,
        landmark: cleanLandmark,
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
        subtotal: subtotal.toFixed(2),
        deliveryCharge: deliveryFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        currency: 'INR',
        paymentMode: 'ONLINE',
        orderStatus: 'PLACED',
        razorpayOrderId: razorpayOrder.id,
        checkoutSessionId: cleanCheckoutSessionId,
        items: {
          create: validatedItems.map((item) => ({
            productReferenceId: item.product.id,
            productName: item.product.name,
            brand: item.product.brand,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            totalPrice: item.totalPrice.toFixed(2),
          })),
        },
        payments: {
          create: {
            paymentMode: 'ONLINE',
            paymentMethod: 'CARD',
            paymentType: 'ONE_TIME',
            amount: totalAmount.toFixed(2),
            currency: 'INR',
            paymentStatus: 'PENDING',
            transactionId,
            razorpayOrderId: razorpayOrder.id,
          },
        },
        statusHistory: {
          create: {
            newStatus: 'PLACED',
            changedBy: 'customer',
            note: 'Order created via Razorpay Checkout.',
          },
        },
      },
    });

    return res.json({
      success: true,
      data: {
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        orderNumber,
        totalAmount,
      },
    });
  } catch (error: any) {
    console.error('[Razorpay Create-Order Exception]:', error.message || error);
    return res.status(500).json({
      success: false,
      error: { code: 'RAZORPAY_ORDER_ERROR', message: error.message || 'Failed to create Razorpay order.' },
    });
  }
});

// POST /api/checkout/razorpay/verify
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderNumber } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_VERIFICATION_DATA', message: 'Missing required Razorpay payment verification tokens.' },
      });
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ razorpayOrderId }, { orderNumber: orderNumber || '' }],
      },
      include: { items: true, payments: true },
    });

    if (!isValid) {
      if (order) {
        const failureMsg = 'Razorpay HMAC-SHA256 signature verification failed (invalid signature token).';
        const pendingPayment = order.payments.find(p => p.paymentStatus === 'PENDING');
        if (pendingPayment) {
          await prisma.payment.update({
            where: { id: pendingPayment.id },
            data: {
              paymentStatus: 'FAILED',
              failureMessage: failureMsg,
              razorpayPaymentId: razorpayPaymentId || undefined,
              razorpaySignature: razorpaySignature || undefined,
              transactionAt: new Date(),
            },
          });
        } else {
          await prisma.payment.create({
            data: {
              orderId: order.id,
              paymentMode: 'ONLINE',
              paymentMethod: 'CARD',
              paymentType: 'ONE_TIME',
              amount: order.totalAmount,
              currency: order.currency || 'INR',
              paymentStatus: 'FAILED',
              failureMessage: failureMsg,
              razorpayOrderId,
              razorpayPaymentId,
              razorpaySignature,
              transactionAt: new Date(),
            },
          });
        }
        await prisma.orderStatusHistory.create({
          data: {
            orderId: order.id,
            previousStatus: order.orderStatus,
            newStatus: order.orderStatus,
            changedBy: 'razorpay-verification',
            note: `Payment verification failed: ${failureMsg}`,
          },
        });
      }
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SIGNATURE', message: 'Razorpay HMAC-SHA256 signature verification failed.' },
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order record was not found for payment verification.' },
      });
    }

    const hasSuccessfulPayment = order.payments.some(p => p.paymentStatus === 'SUCCESS');
    if (hasSuccessfulPayment || order.orderStatus === 'CONFIRMED') {
      res.cookie(`ravi_order_access_${order.orderNumber}`, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 * 7 * 1000,
      });

      return res.json({
        success: true,
        data: {
          orderNumber: order.orderNumber,
          alreadyProcessed: true,
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'CONFIRMED',
        },
      });

      // Always create a new Payment record for the verification attempt to preserve complete audit history
      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentMode: 'ONLINE',
          paymentMethod: 'UPI',
          paymentType: 'ONE_TIME',
          amount: order.totalAmount,
          currency: order.currency || 'INR',
          paymentStatus: 'SUCCESS',
          transactionId: `TXN-${order.orderNumber}-${Date.now().toString().slice(-4)}`,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          transactionAt: new Date(),
        },
      });

      for (const item of order.items) {
        if (item.productReferenceId) {
          await tx.product.update({
            where: { id: item.productReferenceId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: order.orderStatus,
          newStatus: 'CONFIRMED',
          changedBy: 'razorpay-verification',
          note: `Payment verified via Razorpay HMAC-SHA256 (Payment ID: ${razorpayPaymentId}).`,
        },
      });
    });

    res.cookie(`ravi_order_access_${order.orderNumber}`, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 7 * 1000,
    });

    const cartSessionCookie = req.cookies[CART_COOKIE_NAME];
    if (cartSessionCookie) {
      const cart = await prisma.cart.findUnique({
        where: { sessionId: cartSessionCookie },
      });
      if (cart) {
        await prisma.cart.delete({ where: { id: cart.id } });
      }
    }

    return res.json({
      success: true,
      data: { orderNumber: order.orderNumber },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'VERIFICATION_FAILED', message: error.message || 'Payment verification failed.' },
    });
  }
});

// POST /api/checkout/razorpay/failure
router.post('/failure', async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, orderNumber, failureMessage, razorpayPaymentId, code, reason } = req.body;

    if (!razorpayOrderId && !orderNumber) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FAILURE_DATA', message: 'Order identifier is required.' },
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ razorpayOrderId: razorpayOrderId || '' }, { orderNumber: orderNumber || '' }],
      },
      include: { payments: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order record was not found to record payment failure.' },
      });
    }

    const formattedMessage = failureMessage || reason || code || 'Payment failed during checkout processing.';

    const pendingPayment = order.payments.find(p => p.paymentStatus === 'PENDING');
    if (pendingPayment) {
      await prisma.payment.update({
        where: { id: pendingPayment.id },
        data: {
          paymentStatus: 'FAILED',
          failureMessage: formattedMessage,
          razorpayPaymentId: razorpayPaymentId || undefined,
          transactionAt: new Date(),
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMode: 'ONLINE',
          paymentMethod: 'CARD',
          paymentType: 'ONE_TIME',
          amount: order.totalAmount,
          currency: order.currency || 'INR',
          paymentStatus: 'FAILED',
          failureMessage: formattedMessage,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId || undefined,
          transactionAt: new Date(),
        },
      });
    }

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.orderStatus,
        newStatus: order.orderStatus,
        changedBy: 'razorpay-gateway',
        note: `Payment failure logged: ${formattedMessage}`,
      },
    });

    return res.json({
      success: true,
      message: 'Payment failure recorded successfully.',
      data: { orderNumber: order.orderNumber, failureMessage: formattedMessage },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'FAILURE_LOGGING_FAILED', message: error.message || 'Failed to record payment failure.' },
    });
  }
});

export default router;
