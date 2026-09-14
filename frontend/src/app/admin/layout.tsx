import React from 'react';
import Link from 'next/link';
import { getAdminSession } from '@/lib/session';
import { ShieldCheck, Package, ShoppingBag, MapPin, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { AdminLogoutButton } from './AdminLogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAdminSession();

  // Allow rendering unauthenticated login page at /admin/login
  if (!auth) {
    return <>{children}</>;
  }

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Admin Header Bar */}
      <header style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '3px solid var(--primary-blue)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            backgroundColor: 'var(--primary-blue)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '1rem',
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            letterSpacing: '0.05em',
          }}>
            RAVI VISION
          </div>
          <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>
            Store Management Dashboard
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem' }}>
          <span style={{ color: '#cbd5e1' }}>Logged in as: <strong>{auth.user.name}</strong></span>
          <AdminLogoutButton />
        </div>
      </header>

      {/* Admin Navigation Bar */}
      <nav style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.5rem 1.5rem',
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
          <Link href="/admin" style={{ color: 'var(--text-heading)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <LayoutDashboard size={16} color="var(--primary-blue)" /> Dashboard
          </Link>
          <Link href="/admin/products" style={{ color: 'var(--text-heading)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Package size={16} color="var(--primary-blue)" /> Products & Inventory
          </Link>
          <Link href="/admin/orders" style={{ color: 'var(--text-heading)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ShoppingBag size={16} color="var(--primary-blue)" /> Orders
          </Link>
          <Link href="/admin/delivery" style={{ color: 'var(--text-heading)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <MapPin size={16} color="var(--primary-blue)" /> Delivery Zones
          </Link>
          <Link href="/admin/settings" style={{ color: 'var(--text-heading)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Settings size={16} color="var(--primary-blue)" /> Store Settings
          </Link>
        </div>
      </nav>

      {/* Main Admin Content Container */}
      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        {children}
      </div>

    </div>
  );
}
