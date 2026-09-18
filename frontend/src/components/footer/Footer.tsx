'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, MapPin, Clock, Shield, Truck, CreditCard } from 'lucide-react';

interface FooterProps {
  storeConfig: {
    storeName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode?: string;
    openingHours: string;
  };
}

export function Footer({ storeConfig }: FooterProps) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return (
    <footer style={{
      backgroundColor: '#f8fafc',
      color: '#334155',
      fontSize: '0.875rem',
      paddingTop: '3.5rem',
      paddingBottom: '2rem',
      marginTop: '4rem',
      borderTop: '1px solid #e2e8f0',
      boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.03)',
    }}>
      <div className="container">
        {/* Value Proposition Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          paddingBottom: '2.5rem',
          marginBottom: '2.5rem',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', backgroundColor: '#e8f0fe', color: '#0d52bf', border: '1px solid #dbeafe' }}>
              <Truck size={24} />
            </div>
            <div>
              <h5 style={{ color: '#093680', fontWeight: 700, fontSize: '0.95rem' }}>Local ~1-Day Delivery</h5>
              <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
                Fast local delivery for eligible pincodes directly from our store inventory.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', backgroundColor: '#e8f0fe', color: '#0d52bf', border: '1px solid #dbeafe' }}>
              <Phone size={24} />
            </div>
            <div>
              <h5 style={{ color: '#093680', fontWeight: 700, fontSize: '0.95rem' }}>Call to Order Option</h5>
              <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
                Prefer ordering over phone? Call our local store team directly for assistance.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', backgroundColor: '#e8f0fe', color: '#0d52bf', border: '1px solid #dbeafe' }}>
              <Shield size={24} />
            </div>
            <div>
              <h5 style={{ color: '#093680', fontWeight: 700, fontSize: '0.95rem' }}>Genuine Store Warranty</h5>
              <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.2rem' }}>
                All products come with official brand manufacturer warranty and store support.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid #e2e8f0',
        }}>
          {/* Store Info Column */}
          <div>
            <h4 style={{ color: '#0d52bf', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              {storeConfig.storeName || 'RAVI ELECTRONICS'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Your trusted local electronics, electrical, and home-appliance retailer.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <MapPin size={18} color="#0d52bf" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {storeConfig.address ? (
                    `${storeConfig.address}, ${storeConfig.city || 'Kargahar'}, ${storeConfig.state || 'Bihar'} ${storeConfig.pincode || '821107'}`
                  ) : (
                    '4WHG+7H Kargahar, Bihar 821107'
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <Phone size={18} color="#0d52bf" style={{ flexShrink: 0 }} />
                <span>
                  {storeConfig.phone ? (
                    <a href={`tel:${storeConfig.phone}`} style={{ color: '#0d52bf', fontWeight: 700 }}>{storeConfig.phone}</a>
                  ) : (
                    <a href="tel:9631410611" style={{ color: '#0d52bf', fontWeight: 700 }}>9631410611</a>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <Clock size={18} color="#0d52bf" style={{ flexShrink: 0 }} />
                <span>
                  {storeConfig.openingHours || '24/7 Open'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Categories */}
          <div>
            <h5 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Primary Categories</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: 0 }}>
              <li><Link href="/products" style={{ color: '#475569', textDecoration: 'none' }}>All Products</Link></li>
              <li><Link href="/products?category=refrigerators" style={{ color: '#475569', textDecoration: 'none' }}>Refrigerators</Link></li>
              <li><Link href="/products?category=washing-machines" style={{ color: '#475569', textDecoration: 'none' }}>Washing Machines</Link></li>
              <li><Link href="/products?category=air-conditioners" style={{ color: '#475569', textDecoration: 'none' }}>Air Conditioners</Link></li>
              <li><Link href="/products?category=fans" style={{ color: '#475569', textDecoration: 'none' }}>Fans & Coolers</Link></li>
              <li><Link href="/products?category=inverters-batteries" style={{ color: '#475569', textDecoration: 'none' }}>Inverters & Batteries</Link></li>
              <li><Link href="/products?category=ro" style={{ color: '#475569', textDecoration: 'none' }}>RO Water Purifiers</Link></li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div>
            <h5 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Customer Care</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: 0 }}>
              <li><Link href="/track-order" style={{ color: '#0d52bf', fontWeight: 700, textDecoration: 'none' }}>Track Order Status</Link></li>
              <li><Link href="/cart" style={{ color: '#475569', textDecoration: 'none' }}>Shopping Cart</Link></li>
              <li><Link href="/checkout" style={{ color: '#475569', textDecoration: 'none' }}>Guest Checkout</Link></li>
              <li><span style={{ color: '#64748b' }}>Cash on Delivery (COD)</span></li>
              <li><span style={{ color: '#64748b' }}>Razorpay Online Payments</span></li>
              <li><Link href="/admin" style={{ color: '#0d52bf', fontWeight: 600, textDecoration: 'none' }}>Store Admin Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8125rem',
          color: '#64748b',
        }}>
          <div>
            © {new Date().getFullYear()} RAVI ELECTRONICS. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}


