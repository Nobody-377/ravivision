import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const ADMIN_COOKIE_NAME = 'ravi_admin_session';
const SESSION_EXPIRY_DAYS = 7;

/**
 * SHA-256 Hash helper for raw session tokens.
 * Raw tokens are sent in HttpOnly cookie, hashed tokens stored in DB.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate cryptographically secure random 32-byte token string.
 */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create Admin Session in DB with hashed token & set HttpOnly cookie.
 */
export async function createAdminSession(userId: string) {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return rawToken;
}

/**
 * Verify incoming admin session from HttpOnly cookie.
 */
export async function getAdminSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
  });

  if (!session) return null;

  if (new Date() > session.expiresAt) {
    // Expired - clean up
    await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, name: true, mustChangePassword: true },
  });

  if (!user) return null;

  return { session, user };
}

/**
 * Destroy admin session & clear cookie.
 */
export async function revokeAdminSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await prisma.adminSession.delete({ where: { tokenHash } }).catch(() => {});
  }

  cookieStore.delete(ADMIN_COOKIE_NAME);
}
