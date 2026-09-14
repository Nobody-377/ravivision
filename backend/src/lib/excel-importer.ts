import * as xlsx from 'xlsx';
import { prisma } from './prisma.js';

export interface CatalogImportReport {
  validCatalogRows: number;
  departments: number;
  categories: number;
  subcategories: number;
  productDefinitions: number;
  ignoredRows: number;
  ignoredNonCatalogContent: number;
  rowsRequiringReview: number;
  errors: string[];
  reportText: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stringHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

function createSeededRandom(seed: number) {
  let state = seed;
  return function () {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function generateDemoPriceAndMRP(categoryName: string, subcategoryName: string, productType: string) {
  const seedKey = `${categoryName}-${subcategoryName}-${productType}`.toLowerCase();
  const rng = createSeededRandom(stringHash(seedKey));

  const text = seedKey;

  let minPrice = 1000;
  let maxPrice = 20000;
  let stockMin = 3;
  let stockMax = 15;

  if (text.includes('refrigerator') || text.includes('fridge')) {
    minPrice = 12000;
    maxPrice = 90000;
    stockMin = 2;
    stockMax = 8;
  } else if (text.includes('air conditioner') || text.includes('ac')) {
    minPrice = 25000;
    maxPrice = 90000;
    stockMin = 2;
    stockMax = 6;
  } else if (text.includes('washing machine') || text.includes('dryer')) {
    minPrice = 10000;
    maxPrice = 70000;
    stockMin = 2;
    stockMax = 8;
  } else if (text.includes('television') || text.includes('tv')) {
    minPrice = 8000;
    maxPrice = 150000;
    stockMin = 2;
    stockMax = 6;
  } else if (text.includes('air cooler') || text.includes('cooler')) {
    minPrice = 5000;
    maxPrice = 25000;
    stockMin = 3;
    stockMax = 15;
  } else if (text.includes('fan')) {
    minPrice = 1200;
    maxPrice = 8000;
    stockMin = 5;
    stockMax = 25;
  } else if (text.includes('small appliance') || text.includes('iron') || text.includes('grooming')) {
    minPrice = 500;
    maxPrice = 8000;
    stockMin = 5;
    stockMax = 30;
  } else if (text.includes('kitchen') || text.includes('mixer') || text.includes('grind') || text.includes('juicer') || text.includes('kettle') || text.includes('toaster') || text.includes('cooking') || text.includes('induction')) {
    minPrice = 500;
    maxPrice = 15000;
    stockMin = 3;
    stockMax = 20;
  } else if (text.includes('electrical') || text.includes('wire') || text.includes('switch') || text.includes('cable') || text.includes('mcb') || text.includes('accessory') || text.includes('plug')) {
    minPrice = 100;
    maxPrice = 10000;
    stockMin = 10;
    stockMax = 50;
  } else if (text.includes('geyser') || text.includes('water heater') || text.includes('purifier') || text.includes('ro')) {
    minPrice = 3000;
    maxPrice = 25000;
    stockMin = 3;
    stockMax = 12;
  }

  const rawPrice = minPrice + rng() * (maxPrice - minPrice);
  let sellingPrice = Math.round(rawPrice / 100) * 100 - 10;
  if (sellingPrice < minPrice) sellingPrice = minPrice;

  const discountPercent = 0.10 + rng() * 0.15;
  const rawMRP = sellingPrice * (1 + discountPercent);
  let mrp = Math.round(rawMRP / 100) * 100 - 10;
  if (mrp <= sellingPrice) {
    mrp = sellingPrice + 500;
  }

  const stock = Math.floor(stockMin + rng() * (stockMax - stockMin + 1));

  return {
    price: sellingPrice,
    mrp,
    stock,
  };
}

export async function importCatalogFromExcel(filePath: string): Promise<CatalogImportReport> {
  const report: CatalogImportReport = {
    validCatalogRows: 0,
    departments: 0,
    categories: 0,
    subcategories: 0,
    productDefinitions: 0,
    ignoredRows: 0,
    ignoredNonCatalogContent: 0,
    rowsRequiringReview: 0,
    errors: [],
    reportText: '',
  };

  try {
    const workbook = xlsx.readFile(filePath);
    const requiredHeaders = ['department', 'category', 'subcategory', 'product / product type'];

    let targetSheetName: string | null = null;
    let headerRowIndex = -1;
    let colMap: Record<string, number> = {};

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      for (let r = 0; r < data.length; r++) {
        const row = data[r];
        if (!Array.isArray(row)) {
          report.ignoredNonCatalogContent++;
          continue;
        }

        const normalizedRow = row.map((cell) => (cell ? cell.toString().trim().toLowerCase() : ''));
        const hasAllRequired = requiredHeaders.every((req) => normalizedRow.includes(req));

        if (hasAllRequired) {
          targetSheetName = sheetName;
          headerRowIndex = r;
          normalizedRow.forEach((cellText, colIdx) => {
            if (cellText) {
              colMap[cellText] = colIdx;
            }
          });
          report.ignoredNonCatalogContent += r;
          break;
        }
      }

      if (!targetSheetName) {
        report.ignoredNonCatalogContent += data.length;
      } else {
        for (const otherSheet of workbook.SheetNames) {
          if (otherSheet !== targetSheetName) {
            const otherData: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets[otherSheet], { header: 1 });
            report.ignoredNonCatalogContent += otherData.length;
          }
        }
        break;
      }
    }

    if (!targetSheetName || headerRowIndex === -1) {
      throw new Error('Authoritative catalog header row not found in any workbook sheet.');
    }

    const targetSheet = workbook.Sheets[targetSheetName];
    const rawRows: any[][] = xlsx.utils.sheet_to_json(targetSheet, { header: 1 });

    const getColValue = (row: any[], headerKey: string): string => {
      const idx = colMap[headerKey.toLowerCase()];
      if (idx === undefined || !row[idx]) return '';
      return row[idx].toString().trim();
    };

    const mapToPrimaryCategory = (dept: string, cat: string): string => {
      const d = dept.toLowerCase();
      const c = cat.toLowerCase();

      if (d.includes('large')) {
        if (c.includes('refriger')) return 'Refrigerators';
        if (c.includes('wash')) return 'Washing Machines';
        if (c.includes('air') || c.includes('ac')) return 'Air Conditioners';
        if (c.includes('geyser') || c.includes('water')) return 'Geysers';
        return 'Refrigerators';
      }
      if (d.includes('cooling')) {
        if (c.includes('cooler')) return 'Air Coolers';
        if (c.includes('fan')) return 'Fans';
        return 'Air Coolers';
      }
      if (d.includes('kitchen')) {
        if (c.includes('mixer') || c.includes('grind') || c.includes('blender')) return 'Mixer & Grinding';
        if (c.includes('cook') || c.includes('oven') || c.includes('heat')) return 'Cooking';
        if (c.includes('garment') || c.includes('iron') || c.includes('clean')) return 'Garment Care';
        return 'Cooking';
      }
      if (d.includes('power')) {
        if (c.includes('stabil')) return 'Stabilizers';
        return 'Inverters & Batteries';
      }
      if (d.includes('lighting')) {
        return 'LED & Portable Lighting';
      }
      if (d.includes('switch') || d.includes('electrical')) {
        if (c.includes('wire') || c.includes('cable')) return 'Wires & Cables';
        if (c.includes('switch') || c.includes('socket') || c.includes('plug')) return 'Switches & Sockets';
        return 'Protection';
      }
      if (d.includes('sewing')) return 'Machines & Motors';
      if (d.includes('entertainment')) return 'DTH & Audio';
      if (d.includes('electronics')) return 'Cables & Chargers';
      if (d.includes('furniture')) return 'Almirah';
      if (d.includes('water')) return 'RO';

      return cat;
    };

    let processedCount = 0;

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];

      if (!Array.isArray(row) || row.length === 0) {
        report.ignoredRows++;
        continue;
      }

      const departmentName = getColValue(row, 'department');
      const rawCategoryName = getColValue(row, 'category');
      const subcategoryName = getColValue(row, 'subcategory');
      const productType = getColValue(row, 'product / product type');
      const websiteMenuLabel = getColValue(row, 'website menu label') || productType;
      const coreFutureVal = getColValue(row, 'core / future');
      const isCore = coreFutureVal.toLowerCase() === 'core';
      const exampleBrands = getColValue(row, 'example brands') || null;
      const keyAttributes = getColValue(row, 'key selling attributes') || null;
      const serviceDeliveryFlag = getColValue(row, 'service / delivery flag') || null;

      if (!departmentName || !rawCategoryName || !subcategoryName || !productType) {
        report.ignoredRows++;
        continue;
      }

      processedCount++;

      const deptSlug = slugify(departmentName);
      const department = await prisma.department.upsert({
        where: { slug: deptSlug },
        update: { name: departmentName },
        create: { name: departmentName, slug: deptSlug },
      });

      const categoryName = mapToPrimaryCategory(departmentName, rawCategoryName);
      const catSlug = slugify(categoryName);
      const category = await prisma.category.upsert({
        where: { slug: catSlug },
        update: { name: categoryName, departmentId: department.id },
        create: { name: categoryName, slug: catSlug, departmentId: department.id },
      });

      const subcatSlug = slugify(`${categoryName}-${subcategoryName}`);
      const subcategory = await prisma.subcategory.upsert({
        where: { slug: subcatSlug },
        update: { name: subcategoryName, categoryId: category.id },
        create: { name: subcategoryName, slug: subcatSlug, categoryId: category.id },
      });

      let productDefinition = await prisma.productDefinition.findFirst({
        where: {
          subcategoryId: subcategory.id,
          productType,
        },
      });

      if (productDefinition) {
        productDefinition = await prisma.productDefinition.update({
          where: { id: productDefinition.id },
          data: {
            websiteMenuLabel,
            isCore,
            exampleBrands,
            keyAttributes,
            serviceDeliveryFlag,
          },
        });
      } else {
        productDefinition = await prisma.productDefinition.create({
          data: {
            subcategoryId: subcategory.id,
            productType,
            websiteMenuLabel,
            isCore,
            exampleBrands,
            keyAttributes,
            serviceDeliveryFlag,
          },
        });
      }

      let primaryBrand = 'Ravi Vision Store';
      if (exampleBrands) {
        const brandList = exampleBrands.split(',').map((b) => b.trim());
        if (brandList.length > 0) {
          primaryBrand = brandList[processedCount % brandList.length];
        }
      }

      const productSlug = slugify(`${primaryBrand}-${productType}`);
      const sku = `RV-${slugify(primaryBrand).substring(0, 3).toUpperCase()}-${processedCount.toString().padStart(3, '0')}`;
      const pricing = generateDemoPriceAndMRP(categoryName, subcategoryName, productType);

      const requiresInstallation =
        Boolean(serviceDeliveryFlag && serviceDeliveryFlag.toLowerCase().includes('installation')) ||
        categoryName.toLowerCase().includes('air conditioner') ||
        subcategoryName.toLowerCase().includes('side-by-side') ||
        subcategoryName.toLowerCase().includes('front load');

      let specsJson: string | null = null;
      if (keyAttributes) {
        const specKeys = keyAttributes.split(',').map((k) => k.trim());
        const specMap: Record<string, string> = {};
        specKeys.forEach((key, i) => {
          specMap[key] = `Standard Grade (${i + 1})`;
        });
        specsJson = JSON.stringify(specMap);
      }

      const initialStatus = 'ACTIVE';

      await prisma.product.upsert({
        where: { slug: productSlug },
        update: {
          productDefinitionId: productDefinition.id,
          name: `${primaryBrand} ${productType}`,
          brand: primaryBrand,
          sku,
          price: pricing.price,
          mrp: pricing.mrp,
          stock: pricing.stock,
          status: initialStatus,
          isDemoData: true,
          isFeatured: processedCount % 4 === 0,
          isBestSeller: processedCount % 6 === 0,
          requiresInstallation,
          installationDetails: requiresInstallation ? 'Local technician installation provided upon delivery.' : null,
          specifications: specsJson,
          warrantyInfo: '1 Year Brand Manufacturer Warranty',
        },
        create: {
          productDefinitionId: productDefinition.id,
          name: `${primaryBrand} ${productType}`,
          slug: productSlug,
          brand: primaryBrand,
          sku,
          price: pricing.price,
          mrp: pricing.mrp,
          stock: pricing.stock,
          status: initialStatus,
          isDemoData: true,
          isFeatured: processedCount % 4 === 0,
          isBestSeller: processedCount % 6 === 0,
          requiresInstallation,
          installationDetails: requiresInstallation ? 'Local technician installation provided upon delivery.' : null,
          specifications: specsJson,
          warrantyInfo: '1 Year Brand Manufacturer Warranty',
        },
      });

      report.validCatalogRows++;
    }

    report.departments = await prisma.department.count();
    report.categories = await prisma.category.count();
    report.subcategories = await prisma.subcategory.count();
    report.productDefinitions = await prisma.productDefinition.count();
    report.rowsRequiringReview = await prisma.product.count({ where: { isDemoData: true } });

    report.reportText = `
RAVI VISION CATALOG IMPORT

Valid catalog rows: ${report.validCatalogRows}
Departments: ${report.departments}
Categories: ${report.categories}
Subcategories: ${report.subcategories}
Product Definitions: ${report.productDefinitions}

Ignored rows: ${report.ignoredRows}
Ignored non-catalog content: ${report.ignoredNonCatalogContent}
Rows requiring review: ${report.rowsRequiringReview}
Errors: ${report.errors.length}
`.trim();

  } catch (err: any) {
    report.errors.push(err.message || 'Unknown import error');
  }

  return report;
}
