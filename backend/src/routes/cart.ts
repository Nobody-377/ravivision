import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

const router = Router();
const CART_COOKIE_NAME = 'ravi_cart_session';

function getOrCreateCartSessionId(req: Request, res: Response): string {
  let sessionId = (req.headers['x-cart-session-id'] as string) || req.cookies[CART_COOKIE_NAME];

  if (!sessionId) {
    sessionId = crypto.randomBytes(24).toString('hex');
    res.cookie(CART_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }

  return sessionId;
}

// GET /api/cart
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessionId = getOrCreateCartSessionId(req, res);

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
      return res.json({
        success: true,
        data: { id: '', items: [], subtotal: 0, totalItems: 0 },
      });
    }

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

    return res.json({
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
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Unable to fetch cart.' },
    });
  }
});

// POST /api/cart
router.post('/', async (req: Request, res: Response) => {
  try {
    const sessionId = getOrCreateCartSessionId(req, res);
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Product ID is required.' },
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.status !== 'ACTIVE' || product.stock <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'OUT_OF_STOCK', message: 'This item is currently out of stock.' },
      });
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
        return res.status(400).json({
          success: false,
          error: {
            code: 'MAX_STOCK_EXCEEDED',
            message: `Only ${product.stock} units available in store inventory.`,
          },
        });
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

    return res.json({ success: true, message: 'Item added to cart.' });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update cart.' },
    });
  }
});

// PUT /api/cart
router.put('/', async (req: Request, res: Response) => {
  try {
    const sessionId = getOrCreateCartSessionId(req, res);
    const { itemId, quantity } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Cart Item ID is required.' },
      });
    }

    const cart = await prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Cart not found.' } });
    }

    const qtyNum = Number(quantity);
    if (!Number.isInteger(qtyNum)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Quantity must be a valid integer.' } });
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
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Cart item not found.' } });
      }

      if (qtyNum > existingCartItem.product.stock) {
        return res.status(400).json({
          success: false,
          error: { code: 'MAX_STOCK_EXCEEDED', message: `Only ${existingCartItem.product.stock} units available in stock.` },
        });
      }

      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: qtyNum },
      });
    }

    return res.json({ success: true, message: 'Cart updated.' });
  } catch (error: any) {
    console.error('Error updating cart:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update cart.' },
    });
  }
});

export default router;
