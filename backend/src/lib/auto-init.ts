import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';
import { importCatalogFromExcel } from './excel-importer.js';

export async function ensureDatabaseInitialized(): Promise<void> {
  try {
    console.log('🔍 Checking database initialization state...');

    // 1. Ensure Admin Account
    const adminCount = await prisma.adminUser.count().catch(() => 0);
    if (adminCount === 0) {
      console.log('🌱 Seeding default Admin user...');
      const adminUsername = 'admin';
      const targetPassword = '@ravi1921#';
      const passwordHash = await bcrypt.hash(targetPassword, 10);

      await prisma.adminUser.create({
        data: {
          username: adminUsername,
          passwordHash,
          name: 'Ravi Vision Admin',
          mustChangePassword: false,
        },
      });
      console.log('✅ Created default admin account (Username: admin)');
    }

    // 2. Ensure Delivery Zones
    const zoneCount = await prisma.deliveryZone.count().catch(() => 0);
    if (zoneCount === 0) {
      console.log('🌱 Seeding default Bihar delivery zones...');
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

      for (const zone of allowedZones) {
        await prisma.deliveryZone.create({ data: zone });
      }
      console.log(`✅ Created ${allowedZones.length} default delivery zones.`);
    }

    // 3. Ensure Catalog Product Import
    const productCount = await prisma.product.count().catch(() => 0);
    if (productCount === 0) {
      console.log('🌱 Empty catalog detected. Importing website product catalog from Excel...');
      
      const possiblePaths = [
        path.join(process.cwd(), 'Ecommerce_Electronics_Product_Catalog_MVP.xlsx'),
        path.join(process.cwd(), '..', 'Ecommerce_Electronics_Product_Catalog_MVP.xlsx'),
        path.join(process.cwd(), '..', 'frontend', 'Ecommerce_Electronics_Product_Catalog_MVP.xlsx'),
      ];

      const excelPath = possiblePaths.find((p) => fs.existsSync(p));
      if (excelPath) {
        console.log(`✓ Loading Catalog Excel from: ${excelPath}`);
        const report = await importCatalogFromExcel(excelPath);
        console.log(report.reportText);
      } else {
        console.warn('⚠️ Catalog Excel file not found. Skipping auto-import.');
      }
    } else {
      console.log(`✅ Database ready with ${productCount} catalog products.`);
    }
  } catch (error: any) {
    console.error('❌ Error during auto database initialization:', error.message || error);
  }
}
