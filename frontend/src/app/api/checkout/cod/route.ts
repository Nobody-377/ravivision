import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const CART_COOKIE_NAME = 'ravi_cart_session';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { code: 'CART_EMPTY', message: 'Your shopping cart is empty.' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      landmark,
      city,
      state,
      pincode,
    } = body;

    const { getStoreConfig } = await import('@/lib/store-config');
    const storeConfig = await getStoreConfig();
    if (!storeConfig.codEnabled) {
      return NextResponse.json(
        { success: false, error: { code: 'COD_DISABLED', message: 'Cash on Delivery (COD) is currently disabled by store management.' } },
        { status: 400 }
      );
    }

    if (!customerName || !customerPhone || !shippingAddress || !city || !state || !pincode) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_DETAILS', message: 'Please complete all required customer shipping fields.' },
        },
        { status: 400 }
      );
    }

    const zone = await prisma.deliveryZone.findUnique({
      where: { pincode: pincode.trim() },
    });

    if (!zone || !zone.active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNSERVICEABLE_PINCODE',
            message: `Online delivery is currently unavailable for pincode ${pincode}. Please call store directly.`,
          },
        },
        { status: 400 }
      );
    }

    const deliveryChargeDecimal = zone.deliveryCharge;

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'CART_EMPTY', message: 'Your shopping cart is empty.' } },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let subtotalAcc = new Prisma.Decimal(0);
      const snapshotItems = [];

      for (const cartItem of cart.items) {
        const currentProd = await tx.product.findUnique({
          where: { id: cartItem.productId },
        });

        if (!currentProd || currentProd.status !== 'ACTIVE') {
          throw new Error(`Product "${cartItem.product.name}" is no longer available.`);
        }

        if (currentProd.stock < cartItem.quantity) {
          throw new Error(`Insufficient stock for "${currentProd.name}". Available: ${currentProd.stock}`);
        }

        await tx.product.update({
          where: { id: currentProd.id },
          data: {
            stock: { decrement: cartItem.quantity },
          },
        });

        const unitPrice = currentProd.price;
        const itemTotal = unitPrice.mul(cartItem.quantity);
        subtotalAcc = subtotalAcc.add(itemTotal);

        snapshotItems.push({
          productReferenceId: currentProd.id,
          productName: currentProd.name,
          brand: currentProd.brand,
          sku: currentProd.sku,
          quantity: cartItem.quantity,
          unitPrice,
          totalPrice: itemTotal,
        });
      }

      const totalAmount = subtotalAcc.add(deliveryChargeDecimal);

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
      const orderNumber = `RV-${dateStr}-${randomHex}`;
      const transactionId = `TXN-COD-${orderNumber}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: customerName.trim(),
          mobileNumber: customerPhone.trim(),
          customerEmail: customerEmail?.trim() || null,
          address: shippingAddress.trim(),
          landmark: landmark?.trim() || null,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          subtotal: subtotalAcc,
          deliveryCharge: deliveryChargeDecimal,
          totalAmount,
          currency: 'INR',
          paymentMode: 'COD',
          orderStatus: 'PLACED',
          checkoutSessionId: sessionId,
          items: {
            create: snapshotItems,
          },
          payments: {
            create: {
              paymentMode: 'COD',
              paymentMethod: 'COD',
              paymentType: 'ONE_TIME',
              amount: totalAmount,
              currency: 'INR',
              paymentStatus: 'PENDING',
              transactionId,
            },
          },
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: 'PLACED',
              changedBy: 'customer',
              note: 'Order placed successfully via Cash on Delivery (COD).',
            },
          },
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    cookieStore.set(`ravi_order_access_${result.orderNumber}`, 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount.toNumber(),
      },
    });
  } catch (error: any) {
    console.error('Error placing COD order:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'ORDER_FAILED', message: error.message || 'Failed to place order.' },
      },
      { status: 400 }
    );
  }
}
