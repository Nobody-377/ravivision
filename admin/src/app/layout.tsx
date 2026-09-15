import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ravi Vision - Standalone Admin Portal',
  description: 'Management & Fulfillment Portal for Ravi Vision Store Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
