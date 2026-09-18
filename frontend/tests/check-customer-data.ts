import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING DATABASE CUSTOMER & USER DATA ===\n');

  // Check Customer table (New dedicated customer login/signup table)
  const customerCount = await prisma.customer.count();
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`📊 Customer Table Count: ${customerCount}`);
  if (customers.length > 0) {
    console.log('Customer Records Found:');
    customers.forEach((c, idx) => {
      console.log(` ${idx + 1}. Name: "${c.name}", Mobile: "${c.mobileNumber}", Pincode: "${c.pincode}", CreatedAt: ${c.createdAt.toISOString()}`);
    });
  } else {
    console.log('ℹ️ No customer records in Customer table yet.');
  }

  console.log('\n----------------------------------------\n');

  // Check User table (Legacy/Other users)
  const userCount = await prisma.user.count();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`📊 User Table Count: ${userCount}`);
  if (users.length > 0) {
    console.log('User Records Found:');
    users.forEach((u, idx) => {
      console.log(` ${idx + 1}. Name: "${u.name || 'N/A'}", Email: "${u.email || 'N/A'}", Phone: "${u.phone || 'N/A'}", CreatedAt: ${u.createdAt.toISOString()}`);
    });
  } else {
    console.log('ℹ️ No user records in User table yet.');
  }

  console.log('\n----------------------------------------\n');

  // Check AdminUser table
  const adminCount = await prisma.adminUser.count();
  const admins = await prisma.adminUser.findMany({
    select: { id: true, username: true, name: true, createdAt: true },
  });

  console.log(`📊 AdminUser Table Count: ${adminCount}`);
  if (admins.length > 0) {
    console.log('Admin Records Found:');
    admins.forEach((a, idx) => {
      console.log(` ${idx + 1}. Username: "${a.username}", Name: "${a.name}", CreatedAt: ${a.createdAt.toISOString()}`);
    });
  }

  console.log('\n=== CHECK COMPLETED ===');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
