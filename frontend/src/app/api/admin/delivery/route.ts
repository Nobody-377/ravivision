import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/session';

// GET /api/admin/delivery - List all delivery zones
export async function GET() {
  const auth = await getAdminSession();
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } }, { status: 401 });
  }

  const zones = await prisma.deliveryZone.findMany({
    orderBy: { pincode: 'asc' },
  });

  const formatted = zones.map((z) => ({
    id: z.id,
    pincode: z.pincode,
    area: z.area,
    city: z.city,
    active: z.active,
    oneDayDelivery: z.oneDayDelivery,
    deliveryCharge: z.deliveryCharge.toNumber(),
    notes: z.notes,
  }));

  return NextResponse.json({ success: true, data: formatted });
}

// POST /api/admin/delivery - Add or update delivery zone
export async function POST(request: NextRequest) {
  const auth = await getAdminSession();
  if (!auth) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pincode, area, city, active, oneDayDelivery, deliveryCharge, notes } = body;

    if (!pincode || !area || !city) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Pincode, Area, and City are required.' } }, { status: 400 });
    }

    const zone = await prisma.deliveryZone.upsert({
      where: { pincode: pincode.trim() },
      update: {
        area: area.trim(),
        city: city.trim(),
        active: active !== undefined ? active : true,
        oneDayDelivery: oneDayDelivery !== undefined ? oneDayDelivery : false,
        deliveryCharge: deliveryCharge !== undefined ? Number(deliveryCharge) : 0,
        notes: notes?.trim() || null,
      },
      create: {
        pincode: pincode.trim(),
        area: area.trim(),
        city: city.trim(),
        active: active !== undefined ? active : true,
        oneDayDelivery: oneDayDelivery !== undefined ? oneDayDelivery : false,
        deliveryCharge: deliveryCharge !== undefined ? Number(deliveryCharge) : 0,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: zone, message: 'Delivery zone saved.' });
  } catch (error: any) {
    console.error('Error saving delivery zone:', error);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to save delivery zone.' } }, { status: 500 });
  }
}
