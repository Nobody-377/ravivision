import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { getStoreConfig } from '@/lib/store-config';
import { prisma } from '@/lib/prisma';

export default async function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storeConfig = await getStoreConfig();
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, department: { select: { name: true } } },
  });

  return (
    <>
      <Header storeConfig={storeConfig} departments={departments} categories={categories} />
      <main>{children}</main>
      <Footer storeConfig={storeConfig} />
      <MobileBottomNav />
    </>
  );
}
