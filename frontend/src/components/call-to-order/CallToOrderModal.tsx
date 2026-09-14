'use client';

import React, { useState } from 'react';
import { Phone, Copy, Check, X, ShieldCheck, Clock } from 'lucide-react';

interface CallToOrderProps {
  phone: string;
  storeName: string;
  openingHours: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CallToOrderModal({ phone, storeName, openingHours, isOpen, onClose }: CallToOrderProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (phone) {
      navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '1.75rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
          }}>
            <Phone size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)' }}>
            Call to Order from {storeName || 'Ravi Vision'}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Speak directly with our local store team for assistance, stock confirmation, or placing your order over phone.
          </p>
        </div>

        {phone ? (
          <div style={{
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.25rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Store Phone Number
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-blue)', margin: '0.25rem 0 0.75rem 0' }}>
              {phone}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href={`tel:${phone}`}
                className="btn btn-phone"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                <Phone size={16} /> Call Now
              </a>
              <button
                onClick={handleCopy}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Number'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid #fed7aa',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#92400e', marginBottom: '0.25rem' }}>
              Store Phone Number Not Configured
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#b45309' }}>
              The store owner has not set up a public contact phone number yet. Please visit the admin dashboard to configure store contact settings.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {openingHours && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--primary-blue)" />
              <span>Store Hours: <strong>{openingHours}</strong></span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="var(--primary-blue)" />
            <span>Official local offline store support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
