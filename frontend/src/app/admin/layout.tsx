import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: 'Ravi Vision - Store Admin Portal',
  description: 'Management & Fulfillment Portal for Ravi Vision Store Operations',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
