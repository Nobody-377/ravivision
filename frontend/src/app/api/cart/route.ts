import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getCustomerSession } from '@/lib/customer-session';

const CART_COOKIE_NAME = 'ravi_cart_session';

async function getOrCreateCartSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = crypto.randomBytes(24).toString('hex');
    cookieStore.set(CART_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
  }

  return sessionId;
}

// GET /api/cart - Fetch current cart with server-side revalidated prices and stock
export async function GET() {
  try {
    const sessionId = await getOrCreateCartSessionId();

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({
        success: true,
        data: { id: '', items: [], subtotal: 0, totalItems: 0 },
      });
    }

    // Revalidate cart items against server authoritative data
    let subtotal = 0;
    let totalItems = 0;
    const validatedItems = [];

    for (const item of cart.items) {
      const prod = item.product;
      const isAvailable = prod.status === 'ACTIVE' && prod.stock > 0;
      const effectiveQuantity = Math.min(item.quantity, prod.stock);

      const itemTotal = prod.price.toNumber() * effectiveQuantity;
      if (isAvailable) {
        subtotal += itemTotal;
        totalItems += effectiveQuantity;
      }

      validatedItems.push({
        id: item.id,
        productId: prod.id,
        productName: prod.name,
        slug: prod.slug,
        brand: prod.brand,
        sku: prod.sku,
        price: prod.price.toNumber(),
        mrp: prod.mrp.toNumber(),
        stock: prod.stock,
        quantity: item.quantity,
        effectiveQuantity,
        isAvailable,
        itemTotal,
        imageUrl: prod.images[0]?.url || null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: cart.id,
        items: validatedItems,
        subtotal,
        totalItems,
      },
    });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Unable to fetch cart.' } },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart (Requires Customer Authentication)
export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomerSession();
    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          requireAuth: true,
          error: { code: 'UNAUTHENTICATED', message: 'Please login or sign up to add items to your cart.' },
        },
        { status: 401 }
      );
    }

    const sessionId = await getOrCreateCartSessionId();
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Product ID is required.' } },
        { status: 400 }
      );
    }

    // Server stock & status validation
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== 'ACTIVE' || product.stock <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'OUT_OF_STOCK', message: 'Unavailable' } },
        { status: 400 }
      );
    }

    let cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { sessionId } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + Math.max(1, Number(quantity));
      if (newQty > product.stock) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MAX_STOCK_EXCEEDED',
              message: 'Unavailable',
            },
          },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity: Math.min(Math.max(1, Number(quantity)), product.stock),
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Item added to cart.' });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update cart.' } },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update item quantity / remove item
export async function PUT(request: NextRequest) {
  try {
    const sessionId = await getOrCreateCartSessionId();
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Cart Item ID is required.' } },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Cart not found.' } }, { status: 404 });
    }

    const qtyNum = Number(quantity);
    if (!Number.isInteger(qtyNum)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Quantity must be a valid integer.' } }, { status: 400 });
    }

    if (qtyNum <= 0) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, cartId: cart.id },
      });
    } else {
      const existingCartItem = await prisma.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
        include: { product: true },
      });

      if (!existingCartItem) {
        return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Cart item not found.' } }, { status: 404 });
      }

      if (qtyNum > existingCartItem.product.stock) {
        return NextResponse.json(
          { success: false, error: { code: 'MAX_STOCK_EXCEEDED', message: 'Unavailable' } },
          { status: 400 }
        );
      }

      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: qtyNum },
      });
    }

    return NextResponse.json({ success: true, message: 'Cart updated.' });
  } catch (error: any) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update cart.' } },
      { status: 500 }
    );
  }
}
