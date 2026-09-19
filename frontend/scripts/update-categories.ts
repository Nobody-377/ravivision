import { prisma } from '../src/lib/prisma';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const targetCategories = [
  {
    name: 'Televisions',
    subcategories: ['Sony', 'Samsung', 'LG', 'Mi / Xiaomi', 'OnePlus', 'TCL'],
  },
  {
    name: 'Refrigerators',
    subcategories: ['Haier', 'LG', 'Samsung', 'Whirlpool', 'Godrej'],
  },
  {
    name: 'Washing Machines',
    subcategories: ['LG', 'Samsung', 'Whirlpool', 'Bosch', 'IFB', 'Haier'],
  },
  {
    name: 'ACs',
    subcategories: ['Voltas', 'Daikin', 'Blue Star', 'Lloyd', 'LG', 'Hitachi'],
  },
  {
    name: 'Fans',
    subcategories: ['Orient Electric', 'Crompton', 'Havells', 'Bajaj', 'Atomberg'],
  },
  {
    name: 'Microwaves',
    subcategories: ['IFB', 'Samsung', 'LG', 'Bajaj', 'Panasonic'],
  },
  {
    name: 'Inverters',
    subcategories: ['Luminous', 'Microtek', 'Exide', 'Amaron', 'Livguard'],
  },
  {
    name: 'Kitchen Appliances',
    subcategories: ['Prestige', 'Bajaj', 'Philips', 'Sujata', 'Hawkins', 'Wonderchef'],
  },
  {
    name: 'Coolers',
    subcategories: ['Symphony', 'Kenstar', 'Voltas', 'Bajaj', 'Crompton'],
  },
  {
    name: 'Home Appliances',
    subcategories: ['Kent', 'Eureka Forbes', 'Dyson', 'Philips', 'Bajaj'],
  },
  {
    name: 'Geysers',
    subcategories: ['AO Smith', 'Racold', 'V-Guard', 'Crompton', 'Bajaj'],
  },
  {
    name: 'Wiring Materials',
    subcategories: ['Havells', 'Polycab', 'Finolex', 'Anchor', 'Legrand'],
  },
];

async function main() {
  console.log('Starting category & subcategory taxonomy update...');

  // 1. Ensure a default Department exists
  let department = await prisma.department.findFirst({
    where: { name: 'Main Catalog' },
  });

  if (!department) {
    const firstDept = await prisma.department.findFirst();
    if (firstDept) {
      department = firstDept;
    } else {
      department = await prisma.department.create({
        data: {
          name: 'Main Catalog',
          slug: 'main-catalog',
        },
      });
    }
  }

  // 2. Fetch existing categories and clean up or map them
  const existingCategories = await prisma.category.findMany({
    include: { subcategories: true },
  });

  console.log(`Found ${existingCategories.length} existing categories.`);

  // Upsert the 12 requested categories & subcategories
  for (const item of targetCategories) {
    const catSlug = slugify(item.name);

    let category = await prisma.category.findUnique({
      where: { slug: catSlug },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: item.name,
          slug: catSlug,
          departmentId: department.id,
        },
      });
      console.log(`Created category: ${item.name}`);
    } else {
      category = await prisma.category.update({
        where: { id: category.id },
        data: { name: item.name },
      });
      console.log(`Updated category: ${item.name}`);
    }

    // Upsert subcategories (Brands) for this category
    for (const subName of item.subcategories) {
      const subSlug = slugify(`${item.name}-${subName}`);

      const existingSub = await prisma.subcategory.findUnique({
        where: { slug: subSlug },
      });

      if (!existingSub) {
        await prisma.subcategory.create({
          data: {
            name: subName,
            slug: subSlug,
            categoryId: category.id,
          },
        });
        console.log(`  └─ Created subcategory brand: ${subName}`);
      } else {
        await prisma.subcategory.update({
          where: { id: existingSub.id },
          data: { name: subName, categoryId: category.id },
        });
        console.log(`  └─ Updated subcategory brand: ${subName}`);
      }
    }
  }

  // Delete old categories not in target list to keep database pristine
  const validSlugs = targetCategories.map((c) => slugify(c.name));
  for (const oldCat of existingCategories) {
    if (!validSlugs.includes(oldCat.slug)) {
      try {
        await prisma.category.delete({
          where: { id: oldCat.id },
        });
        console.log(`Removed obsolete category: ${oldCat.name}`);
      } catch (err) {
        console.log(`Kept linked category: ${oldCat.name}`);
      }
    }
  }

  console.log('Successfully updated category & subcategory taxonomy in Database!');
}

main()
  .catch((e) => {
    console.error('Error updating taxonomy:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
