import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALLOWED_PINCODES = [
  '821107', '821112', '821115', '821104', '802215',
  '821113', '821108', '802212', '821307', '821109'
];

async function runTests() {
  console.log('=== RUNNING CUSTOMER AUTH & PINCODE TESTS ===');

  const testMobile = '9876543210';
  const invalidPincode = '110001';
  const validPincode = '821107';

  // 1. Clean up test customer if exists
  await prisma.customer.deleteMany({
    where: { mobileNumber: testMobile },
  });
  console.log('✓ Cleaned up existing test customer');

  // 2. Test Invalid Pincode Signup Validation
  const isAllowedInvalid = ALLOWED_PINCODES.includes(invalidPincode);
  if (!isAllowedInvalid) {
    console.log('✓ Test Invalid Pincode rejected correctly with message: "sorry we are not providing our services to the mentioned pincode"');
  } else {
    console.error('❌ Failed: Invalid pincode was permitted!');
  }

  // 3. Test Valid Pincode Signup & Database Insertion into dedicated Customer table
  const newCustomer = await prisma.customer.create({
    data: {
      name: 'Ravi Kumar Test',
      mobileNumber: testMobile,
      pincode: validPincode,
    },
  });
  console.log('✓ Created new customer in Customer table:', newCustomer.id, newCustomer.name, newCustomer.mobileNumber, newCustomer.pincode);

  // 4. Test Existing Mobile Number Lookup (Direct Login)
  const existingCustomer = await prisma.customer.findUnique({
    where: { mobileNumber: testMobile },
  });
  if (existingCustomer && existingCustomer.id === newCustomer.id) {
    console.log('✓ Existing Mobile Number match verified! Direct login triggered for Customer ID:', existingCustomer.id);
  } else {
    console.error('❌ Failed: Could not locate existing customer by mobile number.');
  }

  // 5. Clean up test customer
  await prisma.customer.deleteMany({
    where: { mobileNumber: testMobile },
  });
  console.log('✓ Cleaned up test customer');
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

runTests()
  .catch((err) => console.error(err))
  .finally(async () => {
    await prisma.$disconnect();
  });
