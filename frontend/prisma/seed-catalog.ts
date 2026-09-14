import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { importCatalogFromExcel } from '../src/lib/excel-importer';

const prisma = new PrismaClient();

async function runCatalogImport() {
  let excelPath = path.join(process.cwd(), 'data', 'Ecommerce_Electronics_Product_Catalog_MVP.xlsx');

  if (!fs.existsSync(excelPath)) {
    excelPath = path.join(process.cwd(), 'Ecommerce_Electronics_Product_Catalog_MVP.xlsx');
  }

  if (!fs.existsSync(excelPath)) {
    excelPath = 'C:\\Users\\NANDINI PATEL\\OneDrive\\Desktop\\Ecommerce_Electronics_Product_Catalog_MVP.xlsx';
  }

  if (!fs.existsSync(excelPath)) {
    console.error('❌ ERROR: The Excel workbook Ecommerce_Electronics_Product_Catalog_MVP.xlsx is not found.');
    process.exit(1);
  }

  console.log(`✓ Workbook found: ${excelPath}`);
  console.log('Running catalog import and waste data filtering...\n');

  const report = await importCatalogFromExcel(excelPath);

  console.log(report.reportText);

  if (report.errors.length > 0) {
    console.log('\nErrors encountered during import:');
    report.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }
}

runCatalogImport()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
