'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  CreditCard, 
  FileSpreadsheet, 
  Store,
  ShieldCheck,
  Settings
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders & Tracking', href: '/orders', icon: ShoppingBag },
  { name: 'Inventory & Stock', href: '/inventory', icon: Package },
  { name: 'Customer Directory', href: '/customers', icon: Users },
  { name: 'Payment Transactions', href: '/payments', icon: CreditCard },
  { name: 'Excel Reports', href: '/reports', icon: FileSpreadsheet },
  { name: 'Admin Operations', href: '/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
        }}>
          <Store size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>Ravi Vision</h2>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={12} /> Standalone Admin
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : '#94a3b8',
                background: isActive ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)' : 'transparent',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={19} color={isActive ? '#38bdf8' : '#64748b'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{ marginTop: 'auto', padding: '1rem 0.5rem 0', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          DB Schema: SQLite / Prisma<br />
          System Status: <span style={{ color: '#34d399', fontWeight: 600 }}>Connected</span>
        </div>
      </div>
    </aside>
  );
}
