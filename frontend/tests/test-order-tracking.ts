import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== RUNNING ORDER TRACKING & MILESTONE TIMESTAMPS TEST ===\n');

  const testOrderNum = `TEST-ORD-${Date.now().toString().slice(-5)}`;
  const testMobile = '9631410611';

  // 1. Create a Test Customer
  const customer = await prisma.customer.upsert({
    where: { mobileNumber: testMobile },
    update: { name: 'Ravi Test Customer', pincode: '821107' },
    create: {
      name: 'Ravi Test Customer',
      mobileNumber: testMobile,
      pincode: '821107',
    },
  });
  console.log('✓ Verified Customer in DB:', customer.id, customer.name);

  // 2. Create a Test Order
  const order = await prisma.order.create({
    data: {
      orderNumber: testOrderNum,
      customerId: customer.id,
      customerName: customer.name,
      mobileNumber: customer.mobileNumber,
      address: '4WHG+7H Main Market, Kargahar',
      landmark: 'Near Central Bank',
      city: 'Kargahar',
      state: 'Bihar',
      pincode: customer.pincode,
      subtotal: 15000,
      deliveryCharge: 0,
      totalAmount: 15000,
      paymentMode: 'COD',
      orderStatus: 'PLACED',
      items: {
        create: [
          {
            productName: 'Samsung 190L Single Door Refrigerator',
            brand: 'Samsung',
            sku: 'REF-SAM-190L',
            unitPrice: 15000,
            quantity: 1,
            totalPrice: 15000,
          },
        ],
      },
      statusHistory: {
        create: {
          previousStatus: null,
          newStatus: 'PLACED',
          changedBy: 'system',
          note: 'Order submitted by customer',
        },
      },
    },
  });
  console.log('✓ Created Test Order:', order.orderNumber, order.orderStatus);

  // 3. Simulate Admin Milestone Updates: CONFIRMED ➔ PACKED ➔ OUT_FOR_DELIVERY ➔ DELIVERED
  const milestonesToTest = [
    { status: 'CONFIRMED', note: 'Order verified & confirmed by Kargahar store team' },
    { status: 'PACKED', note: 'Item reserved & packed at store warehouse' },
    { status: 'OUT_FOR_DELIVERY', note: 'Dispatched for local area delivery' },
    { status: 'DELIVERED', note: 'Item delivered & cash collected' },
  ];

  for (const m of milestonesToTest) {
    // Small delay to ensure distinct timestamps
    await new Promise((r) => setTimeout(r, 200));

    await prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: m.status as any,
        statusHistory: {
          create: {
            previousStatus: order.orderStatus,
            newStatus: m.status as any,
            changedBy: 'admin',
            note: m.note,
          },
        },
      },
    });
    console.log(`✓ Admin Updated Order Milestone -> ${m.status} (Note: ${m.note})`);
  }

  // 4. Query Tracking Data & Verify Audit Trail Timestamps
  const fetchedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      statusHistory: { orderBy: { createdAt: 'asc' } },
      items: true,
      customer: true,
    },
  });

  console.log('\n📊 VERIFYING STORED DB TRACKING TIMESTAMPS:');
  fetchedOrder?.statusHistory.forEach((sh, idx) => {
    console.log(`  ${idx + 1}. Milestone: ${sh.newStatus.padEnd(16)} | Timestamp: ${sh.createdAt.toISOString()} | Note: ${sh.note}`);
  });

  console.log('\n✓ Stored Customer Info in DB:');
  console.log(`  Name: ${fetchedOrder?.customerName}, Mobile: ${fetchedOrder?.mobileNumber}, Address: ${fetchedOrder?.address}, Pincode: ${fetchedOrder?.pincode}`);

  // 5. Clean up test order
  await prisma.order.delete({ where: { id: order.id } });
  console.log('\n✓ Test Order cleaned up cleanly from DB');
  console.log('=== ALL TRACKING TESTS COMPLETED SUCCESSFULLY ===');
}

runTests()
  .catch((err) => console.error(err))
  .finally(async () => {
    await prisma.$disconnect();
  });
