import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating Database Store Settings ---');

  const settingsToUpsert = [
    { key: 'storeName', value: 'Ravi Electronics' },
    { key: 'address', value: '4WHG+7H Kargahar' },
    { key: 'city', value: 'Kargahar' },
    { key: 'state', value: 'Bihar' },
    { key: 'pincode', value: '821107' },
    { key: 'openingHours', value: '24/7 Open' },
    { key: 'phone', value: '9631410611' },
  ];

  for (const s of settingsToUpsert) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
    console.log(`✓ Upserted ${s.key} -> ${s.value}`);
  }

  console.log('--- Database Store Settings Updated Successfully ---');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
