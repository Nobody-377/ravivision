import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { importCatalogFromExcel } from '../src/lib/excel-importer.js';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Ravi Vision Database Seed & Catalog Import ---');

  const adminUsername = 'admin';
  const targetPassword = '@ravi1921#';
  const passwordHash = await bcrypt.hash(targetPassword, 10);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash,
      name: 'Ravi Vision Admin',
      mustChangePassword: false,
    },
    create: {
      username: adminUsername,
      passwordHash,
      name: 'Ravi Vision Admin',
      mustChangePassword: false,
    },
  });

  console.log('\n======================================================');
  console.log('🔐 ADMIN ACCOUNT CONFIGURED');
  console.log(`Username: ${adminUsername}`);
  console.log(`Password: ${targetPassword}`);
  console.log('======================================================\n');

  const allowedZones = [
    { pincode: '821107', area: 'Kargahar (Local)', city: 'Rohtas, Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '821112', area: 'Kochas', city: 'Rohtas, Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '821115', area: 'Sasaram (Head Office)', city: 'Rohtas, Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '821104', area: 'Chenari', city: 'Rohtas, Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '802215', area: 'Garh Nokha', city: 'Rohtas, Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '821113', area: 'Sheosagar', city: 'Rohtas, Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '821108', area: 'Kudra', city: 'Kaimur (Bhabhua), Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '802212', area: 'Bikramganj', city: 'Rohtas, Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '821307', area: 'Dehri-on-Sone', city: 'Rohtas, Bihar', oneDayDelivery: true, deliveryCharge: 0 },
    { pincode: '821109', area: 'Mohania', city: 'Kaimur (Bhabhua), Bihar', oneDayDelivery: true, deliveryCharge: 0 },
  ];

  const allowedPincodes = allowedZones.map(z => z.pincode);

  await prisma.deliveryZone.deleteMany({
    where: { pincode: { notIn: allowedPincodes } }
  });

  for (const zone of allowedZones) {
    await prisma.deliveryZone.upsert({
      where: { pincode: zone.pincode },
      update: {
        area: zone.area,
        city: zone.city,
        active: true,
        oneDayDelivery: zone.oneDayDelivery,
        deliveryCharge: zone.deliveryCharge,
      },
      create: {
        pincode: zone.pincode,
        area: zone.area,
        city: zone.city,
        active: true,
        oneDayDelivery: zone.oneDayDelivery,
        deliveryCharge: zone.deliveryCharge,
      },
    });
  }
  console.log(`✓ Updated Delivery Zones: ${allowedPincodes.length} exclusive PIN codes configured`);

  let excelPath = path.join(process.cwd(), '..', 'Ecommerce_Electronics_Product_Catalog_MVP.xlsx');
  if (!fs.existsSync(excelPath)) {
    excelPath = path.join(process.cwd(), 'Ecommerce_Electronics_Product_Catalog_MVP.xlsx');
  }
  if (!fs.existsSync(excelPath)) {
    excelPath = path.join(process.cwd(), '..', 'frontend', 'Ecommerce_Electronics_Product_Catalog_MVP.xlsx');
  }

  if (fs.existsSync(excelPath)) {
    console.log(`✓ Reading Catalog Excel from: ${excelPath}`);
    const summary = await importCatalogFromExcel(excelPath);
    console.log(summary.reportText);
  } else {
    console.log(`⚠️ Excel file not found at ${excelPath}. Skipping Excel import.`);
  }

  console.log('--- Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
