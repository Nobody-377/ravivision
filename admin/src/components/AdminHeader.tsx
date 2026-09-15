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
    router.push('/login');
  };

  return (
    <header className="admin-header">
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{subtitle}</p>}
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
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.4rem 0.85rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem'
        }}>
          <UserCheck size={16} color="#34d399" />
          <span style={{ fontWeight: 600, color: '#f8fafc' }}>Store Administrator</span>
        </div>

        <button 
          onClick={handleLogout} 
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', color: '#f87171' }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </header>
  );
}
