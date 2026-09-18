'use client';

import React, { useState } from 'react';
import { ShoppingCart, Zap, PhoneCall, Check, AlertCircle } from 'lucide-react';
import { CallToOrderModal } from '@/components/call-to-order/CallToOrderModal';
import { CustomerAuthModal } from '@/components/auth/CustomerAuthModal';

interface ProductActionsProps {
  productId: string;
  isOutOfStock: boolean;
  stock?: number;
  phone: string;
  storeName: string;
  openingHours: string;
}

export function ProductActions({ productId, isOutOfStock, stock = 0, phone, storeName, openingHours }: ProductActionsProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const handleAddToCart = async (redirectCheckout = false) => {
    setErrorMsg('');

    if (isOutOfStock || stock <= 0) {
      setErrorMsg('Unavailable');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await res.json();
      if (res.status === 401 || data.requireAuth) {
        setPendingRedirect(redirectCheckout);
        setAuthModalOpen(true);
        return;
      }

      if (data.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2500);

        if (redirectCheckout) {
          window.location.href = '/checkout';
        }
      } else {
        // Show 'Unavailable' if stock limit reached or out of stock
        setErrorMsg('Unavailable');
      }
    } catch {
      setErrorMsg('Unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    // Automatically retry Add to Cart after successful login/signup
    handleAddToCart(pendingRedirect);
  };

  return (
    <>
      <div className="pdp-actions-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1.25rem 0' }}>
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.825rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} color="#dc2626" /> {errorMsg}
          </div>
        )}

        <div className="pdp-buttons-row" style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={() => handleAddToCart(false)}
            disabled={loading || isOutOfStock || stock <= 0}
            className="btn btn-primary pdp-btn"
            style={{
              flex: 1,
              padding: '0.85rem 0.65rem',
              fontSize: '0.875rem',
              opacity: (isOutOfStock || stock <= 0) ? 0.6 : 1,
              cursor: (isOutOfStock || stock <= 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {added ? (
              <>
                <Check size={18} color="#ffffff" /> Added!
              </>
            ) : (isOutOfStock || stock <= 0) ? (
              'Unavailable'
            ) : (
              <>
                <ShoppingCart size={18} /> {loading ? 'Adding...' : 'Add to Cart'}
              </>
            )}
          </button>

          <button
            onClick={() => handleAddToCart(true)}
            disabled={loading || isOutOfStock || stock <= 0}
            className="btn btn-secondary pdp-btn"
            style={{
              flex: 1,
              padding: '0.85rem 0.65rem',
              fontSize: '0.875rem',
              opacity: (isOutOfStock || stock <= 0) ? 0.6 : 1,
              cursor: (isOutOfStock || stock <= 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {(isOutOfStock || stock <= 0) ? 'Unavailable' : <><Zap size={18} /> Buy Now</>}
          </button>
        </div>

        <button
          onClick={() => setCallModalOpen(true)}
          className="btn btn-phone pdp-btn pdp-call-btn"
          style={{ width: '100%', padding: '0.85rem 0.65rem', fontSize: '0.875rem' }}
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

      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        customSubtitle="Please log in or sign up to add this item to your shopping cart"
      />
    </>
  );
}
