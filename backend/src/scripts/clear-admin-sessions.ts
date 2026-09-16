import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma.js';

async function clearAdminSessions() {
  console.log('--- Clearing All Admin Login Sessions ---');
  try {
    const result = await prisma.adminSession.deleteMany({});
    console.log(`✅ Successfully deleted ${result.count} admin session record(s) from the database.`);
    console.log('Frontend database (products, orders, customers, delivery zones) remains 100% intact.');
  } catch (error: any) {
    console.error('❌ Error clearing admin sessions:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAdminSessions();
