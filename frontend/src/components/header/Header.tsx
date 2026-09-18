'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingCart, 
  PhoneCall, 
  Search, 
  Menu, 
  X, 
  MapPin, 
  User, 
  LogOut, 
  UserCheck, 
  Heart, 
  Mic, 
  Truck, 
  ChevronRight,
  Home,
  ShoppingBag,
  Package,
  Settings,
  Zap
} from 'lucide-react';
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
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [showSubHeader, setShowSubHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setShowSubHeader(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 40) {
        setShowSubHeader(false);
      } else if (currentScrollY < lastScrollY) {
        setShowSubHeader(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Row 1: Brand Top Header Bar */}
        <div
          className="container header-top-row"
          style={{
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          {/* Menu Button & Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#1e293b',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span className="header-logo-text" style={{ fontSize: '1.35rem', fontWeight: 900, color: '#093680', letterSpacing: '0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap' }}>
                  R<span style={{ color: '#093680' }}>A</span>VI V<span style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center' }}><Zap size={18} fill="#f59e0b" color="#f59e0b" /></span>SION
                </span>
              </div>
              <span className="header-logo-sub" style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.01em', marginTop: '-2px', whiteSpace: 'nowrap' }}>
                Your Local Electronics & Home Store
              </span>
            </Link>
          </div>

          {/* Right Header Controls: Location Pill, Wishlist, Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {/* Location Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                color: '#1e293b',
                backgroundColor: '#f1f5f9',
                padding: '0.35rem 0.65rem',
                borderRadius: '9999px',
                fontWeight: 600,
              }}
              className="desktop-only-location"
            >
              <MapPin size={14} color="#2563eb" />
              <span>Kargahar</span>
              <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Within 100 km</span>
            </div>

            {/* Cart Icon */}
            <Link
              href="/cart"
              style={{
                position: 'relative',
                color: '#1e293b',
                textDecoration: 'none',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={22} color="#1e293b" />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-6px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account Icon / Customer Profile Badge */}
            {customer ? (
              <Link
                href="/account"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  padding: '0.25rem 0.6rem',
                  textDecoration: 'none',
                }}
              >
                <User size={14} color="#1e40af" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af' }}>{customer.name}</span>
              </Link>
            ) : (
              <Link
                href="/account"
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                aria-label="Account Profile"
              >
                <User size={22} />
              </Link>
            )}
          </div>
        </div>

        {/* Row 2: Search Input Bar (No Scan Button as requested!) */}
        <div className="container" style={{ padding: '0.1rem 1rem 0.65rem 1rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search for products, brands, models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 2.5rem 0.65rem 2.6rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            />
            <button
              type="button"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                padding: '0.2rem',
              }}
              aria-label="Voice Search"
            >
              <Mic size={18} />
            </button>
          </form>
        </div>

        {/* Row 3: Delivery Location & Fast Delivery Pill Sub-bar (Hidden on mobile view!) */}
        <div
          className="delivery-subbar-wrapper"
          style={{
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            maxHeight: showSubHeader ? '40px' : '0px',
            opacity: showSubHeader ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
            fontSize: '0.75rem',
            color: '#334155',
          }}
        >
          <div
            className="container delivery-subbar-container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.35rem 1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
              <MapPin size={14} color="#2563eb" style={{ flexShrink: 0 }} />
              <span>
                Deliver to <strong style={{ color: '#0f172a' }}>821305 (Kargahar)</strong>
              </span>
              <Link href="/products" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', marginLeft: '0.15rem' }}>
                Change
              </Link>
            </div>

            <div
              className="delivery-subbar-pill"
              style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Truck size={13} /> 1-Day Local Delivery <ChevronRight size={13} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 999,
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <span style={{ fontWeight: 800, color: '#093680', fontSize: '1.1rem' }}>RAVI VISION</span>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Home size={18} className="text-blue-600" /> Home Page
              </Link>
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} className="text-blue-600" /> All Products Catalog
              </Link>
              <Link href="/track-order" onClick={() => setMobileMenuOpen(false)} style={{ color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} className="text-emerald-600" /> Track Order Status
              </Link>
              <Link href="/cart" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={18} className="text-blue-600" /> Shopping Cart ({cartCount})
              </Link>
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} className="text-blue-600" /> Admin Portal
              </Link>
            </nav>
          </div>
        </div>
      )}

      <CallToOrderModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        phone={storeConfig.phone}
        storeName={storeConfig.storeName}
        openingHours={storeConfig.openingHours}
      />

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
