import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const CUSTOMER_COOKIE_NAME = 'ravi_customer_session';
const SESSION_EXPIRY_DAYS = 30;

const SECRET_KEY = process.env.ADMIN_JWT_SECRET || 'ravi-vision-customer-session-secret';

interface CustomerSessionData {
  id: string;
  name: string;
  mobileNumber: string;
  pincode: string;
}

function signPayload(payloadStr: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex');
  return `${Buffer.from(payloadStr).toString('base64url')}.${hmac}`;
}

function verifyPayload(token: string): string | null {
  try {
    const [b64, hmac] = token.split('.');
    if (!b64 || !hmac) return null;
    const payloadStr = Buffer.from(b64, 'base64url').toString('utf-8');
    const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return payloadStr;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Set Customer Session cookie.
 */
export async function setCustomerSession(customer: CustomerSessionData) {
  const payload = JSON.stringify({
    id: customer.id,
    mobileNumber: customer.mobileNumber,
    exp: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
  const token = signPayload(payload);

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Retrieve current logged-in Customer from session cookie.
 */
export async function getCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) return null;

  const payloadStr = verifyPayload(token);
  if (!payloadStr) return null;

  try {
    const data = JSON.parse(payloadStr);
    if (data.exp && Date.now() > data.exp) return null;

    const customer = await prisma.customer.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        pincode: true,
        createdAt: true,
      },
    });

    return customer;
  } catch {
    return null;
  }
}

/**
 * Revoke Customer Session & delete cookie.
 */
export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_COOKIE_NAME);
}
