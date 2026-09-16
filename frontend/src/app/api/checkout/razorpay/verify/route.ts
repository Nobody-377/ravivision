import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderNumber } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_VERIFICATION_DATA', message: 'Missing required Razorpay payment verification tokens.' } },
        { status: 400 }
      );
    }

    // 1. Fetch Order from Database
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { razorpayOrderId },
          { orderNumber: orderNumber || '' },
        ],
      },
      include: { items: true, payments: true },
    });

    // 2. Server-Side HMAC SHA-256 Signature Verification
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      if (order) {
        const failureMsg = 'Razorpay HMAC-SHA256 signature verification failed (invalid token).';
        const pendingPayment = order.payments?.find((p) => p.paymentStatus === 'PENDING');
        if (pendingPayment) {
          await prisma.payment.update({
            where: { id: pendingPayment.id },
            data: {
              paymentStatus: 'FAILED',
              failureMessage: failureMsg,
              razorpayPaymentId,
              razorpaySignature,
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
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Razorpay HMAC-SHA256 signature verification failed.' } },
        { status: 400 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order record was not found for payment verification.' } },
        { status: 404 }
      );
    }

    // 3. Idempotency Protection: If order already has a successful payment, return success safely
    const hasPaid = order.payments?.some((p) => p.paymentStatus === 'SUCCESS');
    if (hasPaid) {
      const cookieStore = await cookies();
      cookieStore.set(`ravi_order_access_${order.orderNumber}`, 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400 * 7,
      });

      return NextResponse.json({
        success: true,
        data: {
          orderNumber: order.orderNumber,
          alreadyProcessed: true,
        },
      });
    }

    // 4. Update Order State & Decrement Stock Atomically inside Prisma Transaction
    await prisma.$transaction(async (tx) => {
      // Update order status
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
          currency: order.currency,
          paymentStatus: 'SUCCESS',
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          transactionAt: new Date(),
        },
      });

      // Atomically decrement product stock
      for (const item of order.items) {
        if (item.productReferenceId) {
          await tx.product.update({
            where: { id: item.productReferenceId },
            data: {
              stock: { decrement: item.quantity },
            },
          }).catch(() => {});
        }
      }

      // Add status history record
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

    // 5. Set Guest Access Cookie for Order Confirmation View
    const cookieStore = await cookies();
    cookieStore.set(`ravi_order_access_${order.orderNumber}`, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 * 7,
    });

    // 6. Clear Guest Cart after successful payment
    const cartSessionCookie = cookieStore.get('ravi_cart_session');
    if (cartSessionCookie?.value) {
      const cart = await prisma.cart.findUnique({
        where: { sessionId: cartSessionCookie.value },
      });
      if (cart) {
        await prisma.cart.delete({ where: { id: cart.id } });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'VERIFICATION_FAILED', message: error.message || 'Payment verification failed.' } },
      { status: 500 }
    );
  }
}
