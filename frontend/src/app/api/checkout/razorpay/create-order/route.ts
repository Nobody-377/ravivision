import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getRazorpayServer, isRazorpayConfigured } from '@/lib/razorpay';
import { isValidPhone, isValidPincode, sanitizeString } from '@/lib/sanitize';

const CART_COOKIE_NAME = 'ravi_cart_session';

export async function POST(req: Request) {
  try {
    // 0. Check Environment Configuration
    if (!isRazorpayConfigured()) {
      console.error('[Razorpay Error]: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables.');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RAZORPAY_NOT_CONFIGURED',
            message: 'Razorpay environment variables (NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing on the server.',
          },
        },
        { status: 500 }
      );
    }

    const razorpay = getRazorpayServer();
    if (!razorpay) {
      console.error('[Razorpay Error]: Failed to initialize Razorpay SDK client.');
      return NextResponse.json(
        { success: false, error: { code: 'RAZORPAY_INIT_FAILED', message: 'Failed to initialize Razorpay client.' } },
        { status: 500 }
      );
    }

    const body = await req.json();
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
    } = body;

    // Determine checkout session ID (from body or fallback to cart cookie)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
    const cleanCheckoutSessionId = sanitizeString(checkoutSessionId || sessionCookie || '');

    if (!cleanCheckoutSessionId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_SESSION', message: 'Checkout session ID is required.' } },
        { status: 400 }
      );
    }

    // 1. Backend Protection / Idempotency Check
    // Check if an order for this session has already been completed/paid
    const paidOrder = await prisma.order.findFirst({
      where: {
        checkoutSessionId: cleanCheckoutSessionId,
        paymentStatus: 'PAID',
      },
    });

    if (paidOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_ALREADY_PAID',
            message: 'This order has already been paid and completed.',
          },
        },
        { status: 400 }
      );
    }

    // Check for an active PENDING Razorpay order created within the 20-second protection window
    const twentySecondsAgo = new Date(Date.now() - 20 * 1000);
    const activePendingOrder = await prisma.order.findFirst({
      where: {
        checkoutSessionId: cleanCheckoutSessionId,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PENDING',
        createdAt: { gte: twentySecondsAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activePendingOrder && activePendingOrder.razorpayOrderId) {
      console.log(`[Razorpay Create-Order] Reusing active payment attempt (Order: ${activePendingOrder.orderNumber}, Razorpay Order: ${activePendingOrder.razorpayOrderId}) for session: ${cleanCheckoutSessionId}`);
      return NextResponse.json({
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
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Customer name, phone, shipping address, and pincode are required.' } },
        { status: 400 }
      );
    }

    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PHONE', message: 'Please enter a valid 10-digit Indian mobile number.' } },
        { status: 400 }
      );
    }

    if (!isValidPincode(cleanPincode)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PINCODE', message: 'Please enter a valid 6-digit Indian postal pincode.' } },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_CART', message: 'Cart items are required to create an order.' } },
        { status: 400 }
      );
    }

    // 3. Validate Pincode Delivery Serviceability & Fee
    const zone = await prisma.deliveryZone.findUnique({
      where: { pincode: cleanPincode },
    });

    if (!zone || !zone.active) {
      return NextResponse.json(
        { success: false, error: { code: 'UNSERVICEABLE_PINCODE', message: `Delivery is currently unavailable for pincode ${cleanPincode}.` } },
        { status: 400 }
      );
    }

    const deliveryFee = Number(zone.deliveryCharge || 0);

    // 4. Fetch products directly from DB & calculate prices server-side
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    if (productIds.length !== items.length) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ITEMS', message: 'One or more items are missing valid product IDs.' } },
        { status: 400 }
      );
    }

    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let subtotal = 0;
    const validatedItems: { product: any; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    for (const item of items) {
      const dbProd = dbProducts.find((p) => p.id === item.productId);
      if (!dbProd) {
        console.error(`[Razorpay Create-Order Error]: Product ID ${item.productId} not found in database.`);
        return NextResponse.json(
          { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: `Product was not found.` } },
          { status: 400 }
        );
      }

      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_QUANTITY', message: `Invalid quantity for ${dbProd.name}.` } },
          { status: 400 }
        );
      }

      if (dbProd.stock < qty) {
        return NextResponse.json(
          { success: false, error: { code: 'INSUFFICIENT_STOCK', message: `Only ${dbProd.stock} units of ${dbProd.name} available in stock.` } },
          { status: 400 }
        );
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
    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_AMOUNT', message: 'Order total amount must be greater than 0.' } },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(totalAmount * 100);
    const orderNumber = `RV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    console.log(`[Razorpay Create-Order] Creating Razorpay order for ${orderNumber}, Amount: ₹${totalAmount} (${amountInPaise} paise), Session: ${cleanCheckoutSessionId}`);

    // 5. Create Razorpay Order via Official SDK
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

    // 6. Create PENDING Order record in DB
    await prisma.order.create({
      data: {
        orderNumber,
        customerName: cleanName,
        customerPhone: cleanPhone,
        customerEmail: cleanEmail,
        shippingAddress: cleanAddress,
        landmark: cleanLandmark,
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
        subtotal: subtotal.toFixed(2),
        deliveryCharge: deliveryFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PENDING',
        orderStatus: 'PLACED',
        razorpayOrderId: razorpayOrder.id,
        checkoutSessionId: cleanCheckoutSessionId,
        items: {
          create: validatedItems.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            brand: item.product.brand,
            sku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toFixed(2),
            totalPrice: item.totalPrice.toFixed(2),
          })),
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

    return NextResponse.json({
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
    return NextResponse.json(
      { success: false, error: { code: 'RAZORPAY_ORDER_ERROR', message: error.message || 'Failed to create Razorpay order.' } },
      { status: 500 }
    );
  }
}
