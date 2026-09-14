import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createAdminSession, getAdminSession, revokeAdminSession } from '@/lib/session';

// GET /api/admin/auth - Get current logged in admin user
export async function GET() {
  const result = await getAdminSession();
  if (!result) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: result.user,
  });
}

// POST /api/admin/auth - Admin Login
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Username and password are required.' } },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { username: username.trim() },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_FAILED', message: 'Invalid admin credentials.' } },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_FAILED', message: 'Invalid admin credentials.' } },
        { status: 401 }
      );
    }

    // Create session with SHA-256 hashed token stored in DB and raw token in HttpOnly cookie
    await createAdminSession(admin.id);

    return NextResponse.json({
      success: true,
      user: { id: admin.id, username: admin.username, name: admin.name },
    });
  } catch (error: any) {
    console.error('Error logging in admin:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Authentication error.' } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/auth - Logout
export async function DELETE() {
  await revokeAdminSession();
  return NextResponse.json({ success: true, message: 'Logged out.' });
}
