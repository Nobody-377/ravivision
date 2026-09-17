'use client';

import React, { useState } from 'react';
import { ShoppingCart, Zap, PhoneCall, Check } from 'lucide-react';
import { CallToOrderModal } from '@/components/call-to-order/CallToOrderModal';

interface ProductActionsProps {
  productId: string;
  isOutOfStock: boolean;
  phone: string;
  storeName: string;
  openingHours: string;
}

export function ProductActions({ productId, isOutOfStock, phone, storeName, openingHours }: ProductActionsProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);

  const handleAddToCart = async (redirectCheckout = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();
      if (data.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2500);

        if (redirectCheckout) {
          window.location.href = '/checkout';
        }
      } else {
        alert(data.error?.message || 'Failed to add item to cart.');
      }
    } catch {
      alert('Unable to process cart action at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1.5rem 0' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => handleAddToCart(false)}
            disabled={loading || isOutOfStock}
            className="btn btn-primary"
            style={{ flex: 1, padding: '0.875rem', fontSize: '0.9375rem' }}
          >
            {added ? (
              <>
                <Check size={18} color="#ffffff" /> Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart size={18} /> {loading ? 'Adding...' : 'Add to Cart'}
              </>
            )}
          </button>

          <button
            onClick={() => handleAddToCart(true)}
            disabled={loading || isOutOfStock}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '0.875rem', fontSize: '0.9375rem' }}
          >
            <Zap size={18} /> Buy Now
          </button>
        </div>

        <button
          onClick={() => setCallModalOpen(true)}
          className="btn btn-phone"
          style={{ width: '100%', padding: '0.875rem', fontSize: '0.9375rem' }}
        >
          <PhoneCall size={18} /> Call Ravi Vision to Order Over Phone
        </button>
      </div>

      <CallToOrderModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        phone={phone}
        storeName={storeName}
        openingHours={openingHours}
      />
    </>
  );
}
