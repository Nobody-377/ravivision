import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Clock, Shield, Truck, CreditCard } from 'lucide-react';

interface FooterProps {
  storeConfig: {
    storeName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    openingHours: string;
  };
}

export function Footer({ storeConfig }: FooterProps) {
  return (
    <footer style={{
      backgroundColor: '#0f172a',
      color: '#cbd5e1',
      fontSize: '0.875rem',
      paddingTop: '3rem',
      paddingBottom: '1.5rem',
      marginTop: '4rem',
      borderTop: '4px solid var(--primary-blue)',
    }}>
      <div className="container">
        {/* Value Proposition Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          paddingBottom: '2.5rem',
          marginBottom: '2.5rem',
          borderBottom: '1px solid #334155',
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#1e293b', color: '#60a5fa' }}>
              <Truck size={24} />
            </div>
            <div>
              <h5 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9375rem' }}>Local ~1-Day Delivery</h5>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                Fast local delivery for eligible pincodes directly from our store inventory.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#1e293b', color: '#60a5fa' }}>
              <Phone size={24} />
            </div>
            <div>
              <h5 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9375rem' }}>Call to Order Option</h5>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                Prefer ordering over phone? Call our local store team directly for assistance.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#1e293b', color: '#60a5fa' }}>
              <Shield size={24} />
            </div>
            <div>
              <h5 style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9375rem' }}>Genuine Store Warranty</h5>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>
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
          borderBottom: '1px solid #334155',
        }}>
          {/* Store Info Column */}
          <div>
            <h4 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.125rem', marginBottom: '1rem', letterSpacing: '0.05em' }}>
              RAVI VISION
            </h4>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Your trusted local electronics, electrical, and home-appliance retailer.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <MapPin size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {storeConfig.address ? (
                    `${storeConfig.address}, ${storeConfig.city}, ${storeConfig.state}`
                  ) : (
                    <em style={{ color: '#94a3b8' }}>Store address setup pending</em>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Phone size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                <span>
                  {storeConfig.phone ? (
                    <a href={`tel:${storeConfig.phone}`} style={{ color: '#ffffff', fontWeight: 600 }}>{storeConfig.phone}</a>
                  ) : (
                    <em style={{ color: '#94a3b8' }}>Phone number setup pending</em>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Clock size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                <span>
                  {storeConfig.openingHours ? (
                    storeConfig.openingHours
                  ) : (
                    <em style={{ color: '#94a3b8' }}>Hours setup pending</em>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Categories */}
          <div>
            <h5 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '1rem' }}>Primary Categories</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0 }}>
              <li><Link href="/products" style={{ color: '#cbd5e1', textDecoration: 'none' }}>All Products</Link></li>
              <li><Link href="/products?category=refrigerators" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Refrigerators</Link></li>
              <li><Link href="/products?category=washing-machines" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Washing Machines</Link></li>
              <li><Link href="/products?category=air-conditioners" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Air Conditioners</Link></li>
              <li><Link href="/products?category=fans" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Fans & Coolers</Link></li>
              <li><Link href="/products?category=inverters-batteries" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Inverters & Batteries</Link></li>
              <li><Link href="/products?category=ro" style={{ color: '#cbd5e1', textDecoration: 'none' }}>RO Water Purifiers</Link></li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div>
            <h5 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '1rem' }}>Customer Care</h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0 }}>
              <li><Link href="/cart" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Shopping Cart</Link></li>
              <li><Link href="/checkout" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Guest Checkout</Link></li>
              <li><span style={{ color: '#94a3b8' }}>Cash on Delivery (COD)</span></li>
              <li><span style={{ color: '#94a3b8' }}>Razorpay Online Payments</span></li>
              <li><Link href="/admin/login" style={{ color: '#60a5fa', textDecoration: 'none' }}>Store Owner Login</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright & Canonical Domain */}
        <div style={{
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
          color: '#64748b',
        }}>
          <div>
            © {new Date().getFullYear()} RAVI VISION (ravivision.com). All rights reserved.
          </div>
          <div>
            Production Canonical Domain: <strong style={{ color: '#94a3b8' }}>https://ravivision.com</strong>
          </div>
        </div>
      </div>
    </footer>
  );
}
