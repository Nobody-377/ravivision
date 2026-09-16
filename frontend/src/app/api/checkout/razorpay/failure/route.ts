import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpayOrderId, orderNumber, failureMessage, razorpayPaymentId, code, reason } = body;

    if (!razorpayOrderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FAILURE_DATA', message: 'Order identifier is required.' } },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { razorpayOrderId: razorpayOrderId || '' },
          { orderNumber: orderNumber || '' },
        ],
      },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order record was not found to record payment failure.' } },
        { status: 404 }
      );
    }

    const formattedMessage = failureMessage || reason || code || 'Payment failed during checkout processing.';

    const pendingPayment = order.payments?.find((p) => p.paymentStatus === 'PENDING');

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

    return NextResponse.json({
      success: true,
      message: 'Payment failure recorded successfully.',
      data: { orderNumber: order.orderNumber, failureMessage: formattedMessage },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'FAILURE_LOGGING_FAILED', message: error.message || 'Failed to record payment failure.' } },
      { status: 500 }
    );
  }
}
