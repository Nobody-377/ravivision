'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, PhoneCall, Search, Menu, X, ShieldCheck, MapPin, User, LogOut, UserCheck } from 'lucide-react';
import { CallToOrderModal } from '../call-to-order/CallToOrderModal';
import { CustomerAuthModal } from '../auth/CustomerAuthModal';

interface HeaderProps {
  storeConfig: {
    storeName: string;
    phone: string;
    city: string;
    openingHours: string;
  };
  departments: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  cartCount?: number;
}

export function Header({ storeConfig, departments, categories = [], cartCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customer, setCustomer] = useState<{ id: string; name: string; mobileNumber: string; pincode: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/customer')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.customer) {
          setCustomer(data.customer);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/customer', { method: 'DELETE' });
      setCustomer(null);
      window.location.reload();
    } catch {
      console.error('Failed to log out');
    }
  };

  if (pathname?.startsWith('/admin')) {
    return null;
  }
  const [callModalOpen, setCallModalOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Main Header */}
      <header style={{
        backgroundColor: 'var(--surface-white)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div className="container" style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          
          {/* Brand Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{
              backgroundColor: 'var(--primary-blue)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '1.25rem',
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              letterSpacing: '0.05em',
            }}>
              RAVI ELECTRONICS
            </div>
            <div style={{ display: 'none', flexDirection: 'column', lineHeight: 1.1 }} className="desktop-tagline">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase' }}>
                Electronics & Appliances
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                Local Store & Fast Delivery
              </span>
            </div>
          </Link>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1', maxWidth: '540px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search appliances, primary categories, brands (e.g. Refrigerators, AC, Fans)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 2.5rem 0.625rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--primary-blue)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </form>

          {/* Actions: Call CTA, Customer Auth & Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {customer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.35rem 0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem', fontWeight: 700, color: '#1e40af' }}>
                  <UserCheck size={16} color="#2563eb" /> {customer.name}
                </div>
                <button
                  onClick={handleLogout}
                  title="Log Out"
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="btn btn-outline"
                style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem', borderColor: '#cbd5e1', color: '#1e293b' }}
              >
                <User size={16} color="#2563eb" /> <span>Login / Sign Up</span>
              </button>
            )}

            <button
              onClick={() => setCallModalOpen(true)}
              className="btn btn-phone"
              style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
            >
              <PhoneCall size={16} /> <span style={{ display: 'inline' }}>Call to Order</span>
            </button>

            <Link href="/cart" className="btn btn-outline" style={{ padding: '0.5rem 0.875rem', position: 'relative' }}>
              <ShoppingCart size={20} color="var(--primary-blue)" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-heading)',
                cursor: 'pointer',
                display: 'none',
              }}
              className="mobile-menu-btn"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Primary Categories Navigation Bar */}
        <nav style={{
          backgroundColor: '#f8fafc',
          borderTop: '1px solid var(--border-light)',
          padding: '0.5rem 0',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}>
          <div className="container" style={{ display: 'flex', gap: '1.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
            <Link href="/products" style={{ color: 'var(--primary-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              All Products
            </Link>
            {(categories.length > 0 ? categories : departments).map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.slug)}`}
                style={{ color: 'var(--text-body)', textDecoration: 'none' }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Call to Order Modal */}
      <CallToOrderModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        phone={storeConfig.phone}
        storeName={storeConfig.storeName}
        openingHours={storeConfig.openingHours}
      />

      {/* Customer Login / Signup Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedInCustomer) => {
          setCustomer(loggedInCustomer);
        }}
      />
    </>
  );
}
