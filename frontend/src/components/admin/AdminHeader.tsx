'use client';

import { useRouter } from 'next/navigation';
import { LogOut, UserCheck, RefreshCw } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function AdminHeader({ title, subtitle, onRefresh, isRefreshing }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    router.push('/admin/login');
  };

  return (
    <header className="admin-header">
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            className="btn btn-secondary"
            disabled={isRefreshing}
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: '#eff6ff',
          padding: '0.4rem 0.85rem',
          borderRadius: '10px',
          border: '1px solid #bfdbfe',
          fontSize: '0.85rem'
        }}>
          <UserCheck size={16} color="#2563eb" />
          <span style={{ fontWeight: 600, color: '#1d4ed8' }}>Store Administrator</span>
        </div>

        <button 
          onClick={handleLogout} 
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', color: '#dc2626', borderColor: '#fca5a5', background: '#fff1f2' }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
}
