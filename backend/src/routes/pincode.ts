import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/pincode/check
router.get('/check', async (req: Request, res: Response) => {
  try {
    const pincode = req.query.pincode as string;

    if (!pincode || pincode.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PINCODE', message: 'Please provide a valid 6-digit Indian postal pincode.' },
      });
    }

    const zone = await prisma.deliveryZone.findUnique({
      where: { pincode: pincode.trim() },
    });

    if (!zone || !zone.active) {
      return res.json({
        success: true,
        data: {
          isServiceable: false,
          pincode: pincode.trim(),
          message: 'Online delivery is currently unavailable for this pincode.',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        isServiceable: true,
        pincode: zone.pincode,
        area: zone.area,
        city: zone.city,
        oneDayDelivery: zone.oneDayDelivery,
        deliveryCharge: zone.deliveryCharge.toNumber(),
      },
    });
  } catch (error: any) {
    console.error('Error checking pincode:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Unable to check delivery availability.' },
    });
  }
});

export default router;
