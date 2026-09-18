'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, PhoneCall, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { CallToOrderModal } from '@/components/call-to-order/CallToOrderModal';

interface CartItemData {
  id: string;
  productId: string;
  productName: string;
  slug: string;
  brand: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  quantity: number;
  effectiveQuantity: number;
  isAvailable: boolean;
  itemTotal: number;
  imageUrl?: string;
}

export default function CartPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItemData[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [storePhone, setStorePhone] = useState('');

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setSubtotal(data.data.subtotal || 0);
      }
    } catch {
      console.error('Error fetching cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId: string, newQty: number) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCart();
      } else {
        alert(data.error?.message || 'Failed to update quantity.');
      }
    } catch {
      alert('Error updating cart.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Loading your shopping cart...
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
          Your Shopping Cart
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Server-validated inventory and prices for Ravi Vision local order placement
        </p>
      </div>

      {/* Need Help Banner */}
      <div className="setup-banner" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
        <div className="setup-banner-title">
          <PhoneCall size={18} color="var(--primary-blue)" /> Need help ordering? Call Ravi Vision
        </div>
        <button
          onClick={() => setCallModalOpen(true)}
          className="btn btn-phone"
          style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}
        >
          Call Store Now
        </button>
      </div>

      {items.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(300px, 360px)', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Left: Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((item) => (
              <div key={item.id} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary-blue)',
                }}>
                  {item.brand}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                    {item.brand}
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', margin: '0.125rem 0' }}>
                    <Link href={`/products/${item.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {item.productName}
                    </Link>
                  </h3>


                  {!item.isAvailable && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={14} /> Out of Stock — Please remove to proceed to checkout
                    </div>
                  )}
                </div>

                {/* Price & Quantity Controls */}
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                    {formatINR(item.itemTotal)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => updateQuantity(item.id, 0)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Cart Order Summary Card */}
          <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
              <span>Subtotal ({items.length} items)</span>
              <strong style={{ color: 'var(--text-heading)' }}>{formatINR(subtotal)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <span>Local Delivery Charge</span>
              <span>Calculated at Checkout</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Est. Total</span>
              <span style={{ color: 'var(--primary-blue)' }}>{formatINR(subtotal)}</span>
            </div>

            <Link
              href="/checkout"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="var(--primary-blue)" />
              <span>Safe & Secure Local Checkout</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
            Your Shopping Cart is Empty
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
            Explore our store catalog to add genuine electronics, appliances, and electrical items.
          </p>
          <Link href="/products" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            Browse Store Catalog
          </Link>
        </div>
      )}

      <CallToOrderModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        phone={storePhone}
        storeName="Ravi Vision"
        openingHours=""
      />
    </div>
  );
}
