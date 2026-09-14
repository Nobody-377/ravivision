import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/session';

// GET /api/admin/settings - Fetch store settings & Razorpay integration status
export async function GET() {
  const auth = await getAdminSession();
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } }, { status: 401 });
  }

  // Razorpay integration status (Never reveal actual secret keys!)
  const hasRazorpayKeyId = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  const hasRazorpaySecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
  const razorpayConfigured = hasRazorpayKeyId && hasRazorpaySecret;

  const settingsRows = await prisma.storeSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settingsRows.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return NextResponse.json({
    success: true,
    data: {
      storeName: settingsMap['storeName'] || 'Ravi Vision',
      phone: process.env.STORE_PHONE || settingsMap['phone'] || '',
      codEnabled: settingsMap['codEnabled'] !== 'false',
      onlinePaymentEnabled: settingsMap['onlinePaymentEnabled'] !== 'false',
      paymentIntegrationStatus: {
        razorpayConfigured,
        hasKeyId: hasRazorpayKeyId,
        hasSecret: hasRazorpaySecret,
      },
    },
  });
}

// POST /api/admin/settings - Save store configuration settings
export async function POST(request: NextRequest) {
  const auth = await getAdminSession();
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const allowedKeys = [
      'storeName',
      'codEnabled',
      'onlinePaymentEnabled',
      'defaultDeliveryCharge',
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await prisma.storeSetting.upsert({
          where: { key },
          update: { value: String(body[key]) },
          create: { key, value: String(body[key]) },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Store settings saved successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to save settings.' } }, { status: 500 });
  }
}
