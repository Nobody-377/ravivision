import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { getStoreConfig } from '@/lib/store-config';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'RAVI VISION — Local Electronics, Electrical & Home Appliance Retailer',
  description: 'Order online from Ravi Vision for fast ~1-day local delivery or call our store directly. Quality home appliances, electronics, kitchen items, and electricals.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ravivision.com'),
  alternates: {
    canonical: 'https://ravivision.com',
  },
  openGraph: {
    title: 'RAVI VISION — Local Electronics & Home Appliances',
    description: 'Order online with fast ~1-day local delivery or call store directly.',
    url: 'https://ravivision.com',
    siteName: 'RAVI VISION',
    locale: 'en_IN',
    type: 'website',
  },
};

export default async function RootLayout({
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
    <html lang="en">
      <body suppressHydrationWarning>
        <Header storeConfig={storeConfig} departments={departments} categories={categories} />
        <main>{children}</main>
        <Footer storeConfig={storeConfig} />
      </body>
    </html>
  );
}
