'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'none',
        border: '1px solid #475569',
        color: '#f8fafc',
        padding: '0.25rem 0.625rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
      }}
    >
      <LogOut size={14} /> Logout
    </button>
  );
}
