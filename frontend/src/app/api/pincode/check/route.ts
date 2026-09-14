import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pincode = searchParams.get('pincode')?.trim();

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_PINCODE', message: 'Please provide a valid 6-digit pincode.' },
        },
        { status: 400 }
      );
    }

    const zone = await prisma.deliveryZone.findUnique({
      where: { pincode },
    });

    if (!zone || !zone.active) {
      return NextResponse.json({
        success: true,
        data: {
          pincode,
          isServiceable: false,
          oneDayDelivery: false,
          deliveryCharge: 0,
          message: 'Online delivery is currently unavailable for this pincode.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        pincode,
        isServiceable: true,
        oneDayDelivery: zone.oneDayDelivery,
        deliveryCharge: zone.deliveryCharge.toNumber(),
        area: zone.area,
        city: zone.city,
        message: zone.oneDayDelivery
          ? 'One-day local delivery available for this pincode!'
          : 'Local delivery available for this pincode.',
      },
    });
  } catch (error: any) {
    console.error('Error in pincode check API:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Unable to check pincode at this time.' },
      },
      { status: 500 }
    );
  }
}
