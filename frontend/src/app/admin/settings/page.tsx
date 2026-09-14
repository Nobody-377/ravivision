'use client';

import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, Lock, CheckCircle, AlertCircle, Building, Phone, Mail, Clock } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [storeName, setStoreName] = useState('RAVI VISION');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [codEnabled, setCodEnabled] = useState(true);
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false);

  // Razorpay Config Status (Read-only status, secret never displayed)
  const [razorpayStatus, setRazorpayStatus] = useState({
    configured: false,
    hasKeyId: false,
    hasSecret: false,
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        const d = data.data;
        setStoreName(d.storeName || 'RAVI VISION');
        setPhone(d.phone || '');
        setWhatsapp(d.whatsapp || '');
        setEmail(d.email || '');
        setAddress(d.address || '');
        setCity(d.city || '');
        setState(d.state || '');
        setPincode(d.pincode || '');
        setOpeningHours(d.openingHours || '');
        setCodEnabled(d.codEnabled ?? true);
        setOnlinePaymentEnabled(d.onlinePaymentEnabled ?? false);
        setRazorpayStatus({
          configured: d.paymentIntegrationStatus?.razorpayConfigured || false,
          hasKeyId: d.paymentIntegrationStatus?.hasKeyId || false,
          hasSecret: d.paymentIntegrationStatus?.hasSecret || false,
        });
      }
    } catch {
      console.error('Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          phone,
          whatsapp,
          email,
          address,
          city,
          state,
          pincode,
          openingHours,
          codEnabled,
          onlinePaymentEnabled,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Store settings updated successfully.');
        fetchSettings();
      } else {
        alert(data.error?.message || 'Failed to save settings.');
      }
    } catch {
      alert('Error saving settings.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading store settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)' }}>
          Store Settings & Payment Integration
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Configure business details, public store contact info, payment policies, and integration status
        </p>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Store Business Profile */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={18} color="var(--primary-blue)" /> Store Business Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                Store Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                Public Phone Number (for Call-to-Order)
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98250 XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                WhatsApp Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98250 XXXXX"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                Store Support Email
              </label>
              <input
                type="email"
                placeholder="support@ravivision.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
              Physical Store Address
            </label>
            <textarea
              rows={2}
              placeholder="Full shop address, street, building"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                City
              </label>
              <input
                type="text"
                placeholder="Store City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                State
              </label>
              <input
                type="text"
                placeholder="Store State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                Opening Hours
              </label>
              <input
                type="text"
                placeholder="e.g. 10:00 AM - 9:00 PM (Mon-Sat)"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Payment Integration Status Security Box */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="var(--primary-blue)" /> Razorpay Payment Security & Configuration Status
          </h3>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.375rem' }}>
              <span>Razorpay Gateway Integration Status:</span>
              <span className={`badge ${razorpayStatus.configured ? 'badge-success' : 'badge-warning'}`}>
                {razorpayStatus.configured ? 'Configured via Environment Variables' : 'Unconfigured'}
              </span>
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
              <strong>Security Rule:</strong> Razorpay secret keys are strictly maintained in server environment variables (<code>.env</code>) and are <strong>never stored in database settings</strong> or exposed to the client browser.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
              <div>Key ID: <strong>{razorpayStatus.hasKeyId ? '✓ Present in .env' : '❌ Missing in .env'}</strong></div>
              <div>Key Secret: <strong>{razorpayStatus.hasSecret ? '✓ Present in .env' : '❌ Missing in .env'}</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
              />
              Enable Cash on Delivery (COD) Checkout
            </label>

            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={onlinePaymentEnabled}
                onChange={(e) => setOnlinePaymentEnabled(e.target.checked)}
              />
              Enable Razorpay Online Payment Checkout
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary"
          style={{ padding: '0.875rem', fontSize: '1rem', width: '240px' }}
        >
          <Save size={18} /> Save Settings
        </button>

      </form>

    </div>
  );
}
