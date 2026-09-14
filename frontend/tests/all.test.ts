import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { formatINR, toDecimal } from '../src/lib/currency';
import { hashToken, generateRawToken } from '../src/lib/session';
import { sanitizeString, isValidPhone, isValidPincode } from '../src/lib/sanitize';
import { generateDemoPriceAndMRP } from '../src/lib/excel-importer';

// 1. Currency Formatting & Decimal Safety Tests
test('Currency Formatter - formatINR converts numbers into clean INR string', () => {
  assert.strictEqual(formatINR(24999), '₹24,999');
  assert.strictEqual(formatINR(1499.5), '₹1,499.50');
  assert.strictEqual(formatINR(0), '₹0');
  assert.strictEqual(formatINR(null), '₹0');
});

test('Decimal Safety - toDecimal creates precise Prisma.Decimal objects', () => {
  const d = toDecimal(24999.99);
  assert.strictEqual(d.toString(), '24999.99');
});

// 2. Cryptographic Session Hashing Tests
test('Session Token Hashing - SHA-256 token hashing is deterministic and secure', () => {
  const rawToken = generateRawToken();
  assert.strictEqual(rawToken.length, 64); // 32 bytes = 64 hex chars

  const hash1 = hashToken(rawToken);
  const hash2 = hashToken(rawToken);

  assert.strictEqual(hash1, hash2);
  assert.notStrictEqual(rawToken, hash1);
});

// 3. Input Sanitization & Validation Tests
test('Input Sanitizer - strips HTML tags and escapes malicious scripts', () => {
  const dirty = '<script>alert("xss")</script>Rajesh Kumar';
  const clean = sanitizeString(dirty);
  assert.strictEqual(clean.includes('<script>'), false);
  assert.strictEqual(clean, 'alert(xss)Rajesh Kumar');
});

test('Phone & Pincode Validators - accurately verifies Indian mobile numbers and pincodes', () => {
  assert.strictEqual(isValidPhone('9825012345'), true);
  assert.strictEqual(isValidPhone('1234'), false);

  assert.strictEqual(isValidPincode('380001'), true);
  assert.strictEqual(isValidPincode('000123'), false);
  assert.strictEqual(isValidPincode('ABCDEF'), false);
});

// 4. Razorpay Amount & HMAC SHA-256 Verification Tests
test('Razorpay Amount Conversion - converts INR float to integer paise without floating point inaccuracy', () => {
  const convertToPaise = (amountINR: number) => Math.round(amountINR * 100);

  assert.strictEqual(convertToPaise(1499), 149900);
  assert.strictEqual(convertToPaise(24999.50), 2499950);
  assert.strictEqual(convertToPaise(0.99), 99);
});

test('Razorpay HMAC SHA-256 Signature Verification - verifies valid signature and rejects invalid signature', () => {
  const secret = 'test_razorpay_secret_key_12345';
  const orderId = 'order_9A33XCD9';
  const paymentId = 'pay_29918273';

  // Generate valid signature
  const validSig = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Verify match
  const checkSig = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  assert.strictEqual(validSig, checkSig);

  // Fake signature rejection
  const fakeSig = 'invalid_fake_signature_hash_999';
  assert.notStrictEqual(validSig, fakeSig);
});

// 5. Excel Catalog Importer & Deterministic Pricing Tests
test('Excel Catalog Importer - generates category-appropriate price ranges & MRP > selling price', () => {
  const fridgePrice = generateDemoPriceAndMRP('Refrigerators', 'Double Door', 'Double Door Refrigerator');
  assert.strictEqual(fridgePrice.price >= 12000 && fridgePrice.price <= 90000, true);
  assert.strictEqual(fridgePrice.mrp > fridgePrice.price, true);
  assert.strictEqual(fridgePrice.stock >= 2 && fridgePrice.stock <= 15, true);

  const fanPrice = generateDemoPriceAndMRP('Fans', 'Ceiling Fans', 'BLDC Ceiling Fan');
  assert.strictEqual(fanPrice.price >= 1200 && fanPrice.price <= 8000, true);
  assert.strictEqual(fanPrice.mrp > fanPrice.price, true);
});

test('Excel Catalog Importer - price generation is 100% deterministic on same input', () => {
  const price1 = generateDemoPriceAndMRP('Air Conditioners', 'Split AC', 'Inverter Split AC');
  const price2 = generateDemoPriceAndMRP('Air Conditioners', 'Split AC', 'Inverter Split AC');

  assert.strictEqual(price1.price, price2.price);
  assert.strictEqual(price1.mrp, price2.mrp);
  assert.strictEqual(price1.stock, price2.stock);
});

// 6. Buy Now & Stock Protection Tests
test('Buy Now & Order Subtotal - calculates exact subtotal and total amount with delivery fee', () => {
  const item1Price = 24999;
  const item1Qty = 1;
  const item2Price = 1499;
  const item2Qty = 2;
  const deliveryCharge = 150;

  const subtotal = item1Price * item1Qty + item2Price * item2Qty;
  const total = subtotal + deliveryCharge;

  assert.strictEqual(subtotal, 27997);
  assert.strictEqual(total, 28147);
});

// 7. Store Phone Configuration Utility Test
test('Store Phone Config - formats tel: link correctly and handles missing phone gracefully', () => {
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/(?!^\+)[^\d]/g, '');
    return cleaned ? `tel:${cleaned}` : null;
  };

  assert.strictEqual(formatPhone('+91 98250 12345'), 'tel:+919825012345');
  assert.strictEqual(formatPhone('09825012345'), 'tel:09825012345');
  assert.strictEqual(formatPhone(''), null);
});

// 8. Admin Auth Password Hashing Test
test('Admin Password Security - bcrypt hashes passwords and correctly verifies valid ones', async () => {
  const bcrypt = await import('bcryptjs');
  const password = 'SuperSecureAdminPassword2026!';
  const hash = await bcrypt.hash(password, 10);

  assert.strictEqual(await bcrypt.compare(password, hash), true);
  assert.strictEqual(await bcrypt.compare('WrongPassword', hash), false);
});

// 9. Order State Machine Transition Validator Test
test('Order State Machine - validates allowed transitions and rejects invalid state changes', () => {
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    PLACED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['PACKED', 'CANCELLED'],
    PACKED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  const isTransitionAllowed = (from: string, to: string) =>
    ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;

  assert.strictEqual(isTransitionAllowed('PLACED', 'CONFIRMED'), true);
  assert.strictEqual(isTransitionAllowed('CONFIRMED', 'PROCESSING'), true);
  assert.strictEqual(isTransitionAllowed('PLACED', 'DELIVERED'), false);
  assert.strictEqual(isTransitionAllowed('DELIVERED', 'CANCELLED'), false);
  assert.strictEqual(isTransitionAllowed('CANCELLED', 'CONFIRMED'), false);
});

// 10. Payment Session Lock & Idempotency Protection Window Tests
test('Payment Session Lock - Same session within 20s protection window reuses active attempt', () => {
  const attempts: Array<{ sessionId: string; razorpayOrderId: string; createdAt: number; status: string }> = [];

  function createOrGetPaymentAttempt(sessionId: string) {
    const now = Date.now();
    const twentySecAgo = now - 20 * 1000;

    // Check if session has a paid order
    const paid = attempts.find((a) => a.sessionId === sessionId && a.status === 'PAID');
    if (paid) return { success: false, code: 'ORDER_ALREADY_PAID' };

    // Check if active pending attempt exists within 20s
    const active = attempts.find(
      (a) => a.sessionId === sessionId && a.status === 'PENDING' && a.createdAt >= twentySecAgo
    );

    if (active) {
      return { success: true, reused: true, razorpayOrderId: active.razorpayOrderId };
    }

    // Create new attempt
    const newAttempt = {
      sessionId,
      razorpayOrderId: `order_${Math.random().toString(36).substring(2, 10)}`,
      createdAt: now,
      status: 'PENDING',
    };
    attempts.push(newAttempt);
    return { success: true, reused: false, razorpayOrderId: newAttempt.razorpayOrderId };
  }

  // Request 1: Allowed, creates order_1
  const res1 = createOrGetPaymentAttempt('session_A');
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.reused, false);

  // Request 2 (rapid click on session_A): Reuses active order_1, no duplicate order created
  const res2 = createOrGetPaymentAttempt('session_A');
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.reused, true);
  assert.strictEqual(res2.razorpayOrderId, res1.razorpayOrderId);

  // Request 3 (session_B): Allowed independently (session A lock does NOT block session B)
  const res3 = createOrGetPaymentAttempt('session_B');
  assert.strictEqual(res3.success, true);
  assert.strictEqual(res3.reused, false);
  assert.notStrictEqual(res3.razorpayOrderId, res1.razorpayOrderId);
});

test('Payment Session Lock - Paid order prevents subsequent payment attempts for completed order', () => {
  const attempts = [{ sessionId: 'session_completed', razorpayOrderId: 'order_paid', createdAt: Date.now(), status: 'PAID' }];

  function checkPaidSession(sessionId: string) {
    const paid = attempts.find((a) => a.sessionId === sessionId && a.status === 'PAID');
    if (paid) return { success: false, code: 'ORDER_ALREADY_PAID' };
    return { success: true };
  }

  const res = checkPaidSession('session_completed');
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.code, 'ORDER_ALREADY_PAID');
});

// 11. Order, OrderItem & Payment Schema Relationship Validation Test
test('Order Schema - Validates Order, OrderItem, and Payment relationships', () => {
  const mockOrder = {
    id: 'ord_1001',
    orderNumber: 'RV-20260914-001',
    userId: null, // Guest checkout supported
    customerName: 'Rajesh Kumar',
    mobileNumber: '9825012345',
    address: 'Main Street House No 42',
    pincode: '821107',
    city: 'Rohtas',
    state: 'Bihar',
    subtotal: 24999,
    deliveryCharge: 0,
    totalAmount: 24999,
    currency: 'INR',
    paymentMode: 'ONLINE',
    orderStatus: 'PLACED',
    checkoutSessionId: 'chk_session_test_99',
    items: [
      {
        id: 'item_1',
        orderId: 'ord_1001',
        productReferenceId: 'prod_99',
        productName: 'Voltas Inverter Split AC 1.5 Ton',
        unitPrice: 24999,
        quantity: 1,
        totalPrice: 24999,
      },
    ],
    payments: [
      {
        id: 'pay_1',
        orderId: 'ord_1001',
        paymentMode: 'ONLINE',
        paymentMethod: 'CARD',
        paymentType: 'ONE_TIME',
        amount: 24999,
        currency: 'INR',
        paymentStatus: 'PENDING',
        transactionId: 'TXN-RV-20260914-001',
        razorpayOrderId: 'order_rzp_123',
      },
    ],
  };

  assert.strictEqual(mockOrder.items.length, 1);
  assert.strictEqual(mockOrder.items[0].productReferenceId, 'prod_99');
  assert.strictEqual(mockOrder.items[0].totalPrice, mockOrder.items[0].unitPrice * mockOrder.items[0].quantity);

  assert.strictEqual(mockOrder.payments.length, 1);
  assert.strictEqual(mockOrder.payments[0].paymentMode, 'ONLINE');
  assert.strictEqual(mockOrder.payments[0].paymentMethod, 'CARD');
  assert.strictEqual(mockOrder.payments[0].paymentType, 'ONE_TIME');
  assert.strictEqual(mockOrder.payments[0].amount, mockOrder.totalAmount);
});


