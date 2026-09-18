'use client';

import React, { useState } from 'react';
import { MapPin, CheckCircle2, AlertCircle, Clock, PhoneCall, Zap, Check } from 'lucide-react';

interface PincodeCheckerProps {
  onCallToOrder?: () => void;
  compact?: boolean;
}

interface CheckResult {
  pincode: string;
  isServiceable: boolean;
  oneDayDelivery: boolean;
  deliveryCharge: number;
  area?: string;
  city?: string;
  message: string;
}

export function PincodeChecker({ onCallToOrder, compact = false }: PincodeCheckerProps) {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/pincode/check?pincode=${encodeURIComponent(pincode.trim())}`);
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setResult({
          pincode: pincode.trim(),
          isServiceable: false,
          oneDayDelivery: false,
          deliveryCharge: 0,
          message: data.error?.message || 'Online delivery is currently unavailable for this pincode.',
        });
      }
    } catch {
      setResult({
        pincode: pincode.trim(),
        isServiceable: false,
        oneDayDelivery: false,
        deliveryCharge: 0,
        message: 'Unable to verify pincode. Please try again or call store directly.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: compact ? 'transparent' : 'var(--surface-card)',
      border: compact ? 'none' : '1px solid var(--border-light)',
      borderRadius: compact ? '0' : 'var(--radius-md)',
      padding: compact ? '0' : '0.85rem 1rem',
    }}>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <MapPin size={20} color="var(--primary-blue)" />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
            Check Local Delivery Availability
          </h4>
        </div>
      )}

      <form onSubmit={handleCheck} style={{ display: 'flex', gap: '0.4rem', width: '100%' }}>
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          style={{
            flex: 1,
            minWidth: 0,
            padding: compact ? '0.45rem 0.65rem' : '0.625rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-strong)',
            fontSize: compact ? '0.825rem' : '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={loading || pincode.length !== 6}
          className="btn btn-primary"
          style={{
            padding: compact ? '0.45rem 0.75rem' : '0.625rem 0.85rem',
            fontSize: compact ? '0.825rem' : '0.875rem',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '0.875rem', fontSize: '0.875rem' }}>
          {result.isServiceable ? (
            <div style={{
              backgroundColor: 'var(--status-success-bg)',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              color: '#15803d',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700 }}>
                <CheckCircle2 size={18} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  {result.oneDayDelivery ? (
                    <>
                      <Zap size={15} fill="#d97706" color="#d97706" /> One-day local delivery available!
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Local delivery available
                    </>
                  )}
                </span>
              </div>
              <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem', color: '#166534' }}>
                {result.area && `${result.area}, ${result.city} — `}
                {result.deliveryCharge === 0 ? 'Free Delivery' : `Delivery Fee: ₹${result.deliveryCharge}`}
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'var(--status-warning-bg)',
              border: '1px solid #fed7aa',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              color: '#92400e',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                <AlertCircle size={18} />
                <span>Online delivery is currently unavailable for {result.pincode}.</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#b45309', marginBottom: '0.5rem' }}>
                We may still deliver to your area via store booking or direct phone order.
              </p>
              {onCallToOrder && (
                <button
                  onClick={onCallToOrder}
                  className="btn btn-phone"
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.8125rem' }}
                >
                  <PhoneCall size={14} /> Call Ravi Vision to Order
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
