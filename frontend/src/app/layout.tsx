import type { Metadata } from 'next';
import './globals.css';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
