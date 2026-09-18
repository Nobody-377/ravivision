import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSession, setCustomerSession, clearCustomerSession } from '@/lib/customer-session';

// The 10 exclusive Kargahar Region & Surrounding Tehsils Pincodes
const ALLOWED_PINCODES = [
  '821107', // Kargahar (Local)
  '821112', // Kochas
  '821115', // Sasaram (Head Office)
  '821104', // Chenari
  '802215', // Garh Nokha
  '821113', // Sheosagar
  '821108', // Kudra
  '802212', // Bikramganj
  '821307', // Dehri-on-Sone
  '821109', // Mohania
];

/**
 * GET /api/auth/customer - Fetch currently logged in customer profile
 */
export async function GET() {
  try {
    const customer = await getCustomerSession();
    return NextResponse.json({
      success: true,
      customer: customer || null,
    });
  } catch (error) {
    console.error('Error fetching customer session:', error);
    return NextResponse.json({ success: false, customer: null }, { status: 500 });
  }
}

/**
 * POST /api/auth/customer - Customer Login / Signup handler
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'login', name, mobileNumber, pincode } = body;

    // Clean & Sanitize Mobile Number
    const cleanedMobile = (mobileNumber || '').replace(/\D/g, '').trim();

    if (!cleanedMobile || cleanedMobile.length !== 10) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_MOBILE', message: 'Please enter a valid 10-digit mobile number.' } },
        { status: 400 }
      );
    }

    // ----------------------------------------------------
    // ACTION: LOGIN (Takes mobile number)
    // ----------------------------------------------------
    if (action === 'login') {
      const customer = await prisma.customer.findUnique({
        where: { mobileNumber: cleanedMobile },
      });

      if (customer) {
        // Direct Login if mobile number matches database
        await setCustomerSession({
          id: customer.id,
          name: customer.name,
          mobileNumber: customer.mobileNumber,
          pincode: customer.pincode,
        });

        return NextResponse.json({
          success: true,
          message: 'Successfully logged in!',
          customer: {
            id: customer.id,
            name: customer.name,
            mobileNumber: customer.mobileNumber,
            pincode: customer.pincode,
          },
        });
      }

      // Mobile number not found in database -> prompt user to sign up
      return NextResponse.json({
        success: false,
        isNewUser: true,
        message: 'No account found with this mobile number. Please complete your registration below.',
      });
    }

    // ----------------------------------------------------
    // ACTION: SIGNUP (Takes name, mobile number, pincode)
    // ----------------------------------------------------
    if (action === 'signup') {
      // 1. Check if user already exists -> if so, directly log in!
      const existingCustomer = await prisma.customer.findUnique({
        where: { mobileNumber: cleanedMobile },
      });

      if (existingCustomer) {
        await setCustomerSession({
          id: existingCustomer.id,
          name: existingCustomer.name,
          mobileNumber: existingCustomer.mobileNumber,
          pincode: existingCustomer.pincode,
        });

        return NextResponse.json({
          success: true,
          message: 'Your account was found and you have been logged in directly!',
          customer: {
            id: existingCustomer.id,
            name: existingCustomer.name,
            mobileNumber: existingCustomer.mobileNumber,
            pincode: existingCustomer.pincode,
          },
        });
      }

      // 2. Validate Name
      const cleanedName = (name || '').trim();
      if (!cleanedName || cleanedName.length < 2) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_NAME', message: 'Please enter your full name.' } },
          { status: 400 }
        );
      }

      // 3. Validate Pincode
      const cleanedPincode = (pincode || '').trim();
      if (!cleanedPincode || cleanedPincode.length !== 6) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_PINCODE', message: 'Please enter a valid 6-digit pincode.' } },
          { status: 400 }
        );
      }

      // Check pincode against allowed 10 pincodes & database delivery zones
      const isAllowedPincode = ALLOWED_PINCODES.includes(cleanedPincode);
      const dbZone = await prisma.deliveryZone.findUnique({
        where: { pincode: cleanedPincode },
      });

      const isServiceable = isAllowedPincode || (dbZone && dbZone.active);

      if (!isServiceable) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNSERVICEABLE_PINCODE',
              message: 'sorry we are not providing our services to the mentioned pincode',
            },
          },
          { status: 400 }
        );
      }

      // 4. Create Customer in DB
      const newCustomer = await prisma.customer.create({
        data: {
          name: cleanedName,
          mobileNumber: cleanedMobile,
          pincode: cleanedPincode,
        },
      });

      // 5. Directly log in after registration
      await setCustomerSession({
        id: newCustomer.id,
        name: newCustomer.name,
        mobileNumber: newCustomer.mobileNumber,
        pincode: newCustomer.pincode,
      });

      return NextResponse.json({
        success: true,
        message: 'Account created successfully!',
        customer: {
          id: newCustomer.id,
          name: newCustomer.name,
          mobileNumber: newCustomer.mobileNumber,
          pincode: newCustomer.pincode,
        },
      });
    }

    return NextResponse.json({ success: false, error: { message: 'Invalid action.' } }, { status: 400 });
  } catch (error: any) {
    console.error('Customer Auth API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/customer - Logout handler
 */
export async function DELETE() {
  try {
    await clearCustomerSession();
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: { message: 'Failed to log out.' } }, { status: 500 });
  }
}
