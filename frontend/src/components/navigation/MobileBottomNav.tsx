'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Categories', href: '/products', icon: LayoutGrid },
    { label: 'Orders', href: '/track-order', icon: ShoppingBag },
    { label: 'Account', href: '/account', icon: User },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (pathname === href) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(href);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0.4rem 0.25rem 0.5rem 0.25rem',
        zIndex: 10000,
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.06)',
      }}
      className="mobile-bottom-nav"
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={(e) => handleNavClick(e, item.href)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: isActive ? '#2563eb' : '#64748b',
              flex: 1,
              gap: '0.15rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
              padding: '0.2rem 0',
            }}
          >
            <IconComponent size={20} color={isActive ? '#2563eb' : '#64748b'} />
            <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 700 : 500 }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
