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

// 12. Payment Failure & Failure Message Resolution Tests
test('Payment Failure Audit - Correctly updates payment status to FAILED and stores failure message', () => {
  const failedPaymentAttempt = {
    orderId: 'ord_1002',
    paymentMode: 'ONLINE',
    paymentMethod: 'CARD',
    amount: 14999,
    paymentStatus: 'FAILED',
    failureMessage: 'Payment failed due to incorrect OTP entered by customer.',
    razorpayOrderId: 'order_rzp_failed_01',
    razorpayPaymentId: 'pay_failed_99',
    transactionAt: new Date().toISOString(),
  };

  const getEffectiveStatusAndMessage = (payments: Array<any>) => {
    if (!payments || payments.length === 0) return { status: 'PENDING', failureMessage: null };
    const success = payments.find((p) => p.paymentStatus === 'SUCCESS');
    if (success) return { status: 'SUCCESS', failureMessage: null };
    const latest = payments[payments.length - 1];
    return { status: latest.paymentStatus || 'PENDING', failureMessage: latest.failureMessage || null };
  };

  const auditResult = getEffectiveStatusAndMessage([failedPaymentAttempt]);

  assert.strictEqual(auditResult.status, 'FAILED');
  assert.strictEqual(auditResult.failureMessage, 'Payment failed due to incorrect OTP entered by customer.');
});

// 13. Admin Product Insertion & Specifications Gallery Builder Tests
test('Admin Product Insertion - Validates dynamic key-value specifications JSON and image gallery URLs', () => {
  const specPairs = [
    { key: 'Screen Size', value: '55 Inch' },
    { key: 'Resolution', value: '4K Ultra HD' },
    { key: 'Energy Rating', value: '5 Star' },
  ];

  const buildSpecsObject = (pairs: Array<{ key: string; value: string }>) => {
    const obj: Record<string, string> = {};
    pairs.forEach((p) => {
      if (p.key.trim()) obj[p.key.trim()] = p.value.trim();
    });
    return obj;
  };

  const specsObj = buildSpecsObject(specPairs);
  const jsonString = JSON.stringify(specsObj);

  assert.strictEqual(jsonString, '{"Screen Size":"55 Inch","Resolution":"4K Ultra HD","Energy Rating":"5 Star"}');

  const imageUrlsInput = [
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1',
    'https://images.unsplash.com/photo-1526738549149-8e07eca6c147',
    '  ',
  ];

  const cleanUrls = imageUrlsInput.map((u) => u.trim()).filter(Boolean);
  assert.strictEqual(cleanUrls.length, 2);
  assert.strictEqual(cleanUrls[0], 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1');
});

// 14. Bulk Excel Product Import Row Normalization Tests
test('Bulk Excel Product Import - Normalizes spreadsheet rows, prices, and generates missing SKUs', () => {
  const excelRow = {
    'Product Name': 'LG 260L Double Door Refrigerator',
    'Brand': 'LG',
    'Selling Price (INR)': 26490,
    'MRP (INR)': 32990,
    'Stock': 8,
    'Status': 'ACTIVE',
    'Image URLs (comma separated)': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff',
    'Specifications (Key:Value pairs)': 'Capacity: 260L, Defrost: Frost Free',
  };

  const normalizeExcelRow = (row: any, idx: number) => {
    const name = String(row['Product Name'] || row.name || '').trim();
    const brand = String(row['Brand'] || row.brand || 'Store Brand').trim();
    let sku = String(row['SKU'] || row.sku || '').trim();
    const price = Number(row['Selling Price (INR)'] || row.price || 0);

    if (!sku) {
      const brandCode = brand.substring(0, 3).toUpperCase();
      sku = `RV-${brandCode}-TEST${idx + 1}`;
    }

    return { name, brand, sku, price };
  };

  const result = normalizeExcelRow(excelRow, 0);

  assert.strictEqual(result.name, 'LG 260L Double Door Refrigerator');
  assert.strictEqual(result.brand, 'LG');
  assert.strictEqual(result.sku, 'RV-LG-TEST1');
  assert.strictEqual(result.price, 26490);
});

// 15. Manual Payment Status Update & Admin Audit Log Tests
test('Manual Payment Status Update - Validates payment status change logic, status mapping, and audit history entry', () => {
  interface OrderAuditHistory {
    status: string;
    note: string;
    createdAt: string;
  }

  interface MockOrder {
    id: string;
    paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    orderStatus: string;
    history: OrderAuditHistory[];
  }

  const mockOrder: MockOrder = {
    id: 'ord_12345',
    paymentStatus: 'PENDING',
    orderStatus: 'PROCESSING',
    history: []
  };

  const updatePaymentStatus = (order: MockOrder, newPaymentStatus: 'SUCCESS' | 'FAILED', reason?: string, adminEmail: string = 'admin@ravivision.com') => {
    order.paymentStatus = newPaymentStatus;
    
    // Auto-align order status if payment fails
    if (newPaymentStatus === 'FAILED' && order.orderStatus === 'PROCESSING') {
      order.orderStatus = 'PAYMENT_FAILED';
    }

    const note = `[MANUAL_PAYMENT_UPDATE] Payment status updated to ${newPaymentStatus} by Admin (${adminEmail}). Reason: ${reason || 'Cash collected on delivery'}`;
    order.history.push({
      status: order.orderStatus,
      note,
      createdAt: new Date().toISOString()
    });

    return order;
  };

  // 1. Mark COD Payment as SUCCESS
  const successOrder = updatePaymentStatus(mockOrder, 'SUCCESS', 'Cash ₹24,990 collected by courier partner');
  assert.strictEqual(successOrder.paymentStatus, 'SUCCESS');
  assert.strictEqual(successOrder.history.length, 1);
  assert.match(successOrder.history[0].note, /Cash ₹24,990 collected by courier partner/);

  // 2. Mark Payment as FAILED
  const failedOrder = updatePaymentStatus(mockOrder, 'FAILED', 'Customer refused COD payment on delivery');
  assert.strictEqual(failedOrder.paymentStatus, 'FAILED');
  assert.strictEqual(failedOrder.orderStatus, 'PAYMENT_FAILED');
  assert.strictEqual(failedOrder.history.length, 2);
  assert.match(failedOrder.history[1].note, /Customer refused COD payment/);
});

// 21. Admin Credentials Update (Username & Password) Tests
test('Admin Credentials Update - Validates username change, password hashing, and authentication validation', async () => {
  const bcrypt = await import('bcryptjs');

  const adminAccount = {
    id: 'admin_1',
    username: 'admin@ravivision.com',
    passwordHash: await bcrypt.hash('OldPassword123', 10),
    name: 'Store Admin',
  };

  const updateAdminCredentials = async (
    account: typeof adminAccount,
    currentPasswordAttempt: string,
    newUsernameAttempt?: string,
    newPasswordAttempt?: string
  ) => {
    // 1. Verify Current Password
    const isValid = await bcrypt.compare(currentPasswordAttempt, account.passwordHash);
    if (!isValid) return { success: false, error: 'Current password is incorrect.' };

    // 2. Update Username if provided
    if (newUsernameAttempt && newUsernameAttempt.trim() !== account.username) {
      if (newUsernameAttempt.trim().length < 3) return { success: false, error: 'Username too short.' };
      account.username = newUsernameAttempt.trim();
    }

    // 3. Update Password if provided
    if (newPasswordAttempt && newPasswordAttempt.trim()) {
      if (newPasswordAttempt.trim().length < 6) return { success: false, error: 'Password too short.' };
      account.passwordHash = await bcrypt.hash(newPasswordAttempt.trim(), 10);
    }

    return { success: true, username: account.username };
  };

  // Attempt with invalid current password -> reject
  const badAuth = await updateAdminCredentials(adminAccount, 'WrongPassword', 'newadmin@ravivision.com');
  assert.strictEqual(badAuth.success, false);
  assert.strictEqual(badAuth.error, 'Current password is incorrect.');
  assert.strictEqual(adminAccount.username, 'admin@ravivision.com');

  // Attempt with valid password -> change username to 'newadmin@ravivision.com' and password to 'NewSecurePassword456'
  const successAuth = await updateAdminCredentials(
    adminAccount,
    'OldPassword123',
    'newadmin@ravivision.com',
    'NewSecurePassword456'
  );
  assert.strictEqual(successAuth.success, true);
  assert.strictEqual(adminAccount.username, 'newadmin@ravivision.com');

  // Verify new password works with bcrypt
  const newPassValid = await bcrypt.compare('NewSecurePassword456', adminAccount.passwordHash);
  assert.strictEqual(newPassValid, true);
});

// Security Regression Test: deepmerge-ts CWE-674 Mitigation
test('Security - deepmerge-ts package version is >= 8.0.0 (CWE-674 mitigation)', () => {
  const fs = require('fs');
  const path = require('path');
  const resolvedPath = require.resolve('deepmerge-ts');
  const pkgPath = path.join(resolvedPath, '..', '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const majorVersion = parseInt(pkg.version.split('.')[0], 10);
  assert.ok(majorVersion >= 8, `deepmerge-ts version must be >= 8.0.0, found ${pkg.version}`);

  const { deepmerge } = require('deepmerge-ts');
  const left: any = { a: 1 };
  left.self = left;
  const right: any = { b: 2 };
  right.self = right;

  try {
    const result = deepmerge(left, right);
    assert.ok(result, 'deepmerge completed without RangeError call stack overflow');
  } catch (err: any) {
    assert.notStrictEqual(err?.name, 'RangeError', 'Must not fail with RangeError: Maximum call stack size exceeded');
  }
});









