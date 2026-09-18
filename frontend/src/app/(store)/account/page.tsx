'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Smartphone, 
  MapPin, 
  LogOut, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface CustomerProfile {
  id: string;
  name: string;
  mobileNumber: string;
  pincode: string;
  createdAt?: string;
}

function AccountPageContent() {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth form state for logged-out view
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [mobileNumber, setMobileNumber] = useState('');
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch logged in customer session
  useEffect(() => {
    fetch('/api/auth/customer')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.customer) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      })
      .catch(() => {
        setCustomer(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await fetch('/api/auth/customer', { method: 'DELETE' });
      setCustomer(null);
      window.location.reload();
    } catch {
      setErrorMsg('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanMobile = mobileNumber.replace(/\D/g, '').trim();
    if (cleanMobile.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', mobileNumber: cleanMobile }),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        setSuccessMsg('Logged in successfully!');
        setCustomer(data.customer);
        window.location.reload();
      } else if (data.isNewUser) {
        setErrorMsg(data.message || 'Mobile number not found. Please register below.');
        setMode('signup');
      } else {
        setErrorMsg(data.error?.message || 'Failed to log in. Please check your mobile number.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Signup
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanMobile = mobileNumber.replace(/\D/g, '').trim();
    const cleanName = name.trim();
    const cleanPincode = pincode.trim();

    if (cleanMobile.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (cleanName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (cleanPincode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit pincode.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: cleanName,
          mobileNumber: cleanMobile,
          pincode: cleanPincode,
        }),
      });

      const data = await res.json();
      if (data.success && data.customer) {
        setSuccessMsg('Registration successful!');
        setCustomer(data.customer);
        window.location.reload();
      } else {
        setErrorMsg(data.error?.message || 'Signup failed. Please try again.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading account details...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LOGGED IN VIEW: User Details Profile & Logout
  // --------------------------------------------------------------------------
  if (customer) {
    const initials = customer.name ? customer.name.charAt(0).toUpperCase() : 'U';

    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.25rem 1rem 3rem 1rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        
        {/* Profile Card Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #093680 0%, #1d52bf 60%, #2563eb 100%)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Initials Circle */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#093680',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 900,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                <CheckCircle2 size={12} color="#86efac" /> Verified Customer
              </div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                {customer.name}
              </h1>
              <p style={{ fontSize: '0.825rem', color: '#bfdbfe', margin: '0.2rem 0 0 0' }}>
                Ravi Vision Store Member
              </p>
            </div>
          </div>
        </div>

        {/* User Details Grid */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 1rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
            Account & Contact Details
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={20} color="#2563eb" />
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Full Name</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{customer.name}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Smartphone size={20} color="#2563eb" />
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Mobile Number</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>+91 {customer.mobileNumber}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={20} color="#16a34a" />
              </div>
              <div>
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block' }}>Registered Delivery Pincode</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{customer.pincode} (Kargahar Region)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Link
            href="/track-order"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} color="#2563eb" />
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>My Orders</span>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Track order status</span>
            </div>
          </Link>

          <Link
            href="/cart"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={20} color="#d97706" />
            </div>
            <div>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>Shopping Cart</span>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>View items in cart</span>
            </div>
          </Link>
        </div>

        {/* Log Out Button Section */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #fee2e2', borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b', margin: '0 0 0.5rem 0' }}>
            Account Session
          </h3>
          <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0 0 1rem 0' }}>
            Log out from your customer account on this device.
          </p>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
            }}
          >
            <LogOut size={18} /> Log Out Account
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LOGGED OUT VIEW: Login / Signup Form
  // --------------------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(circle at 50% 0%, #eff6ff 0%, #f4f7fe 70%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -10px rgba(37, 99, 235, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #1d4ed8 100%)',
            color: '#ffffff',
            padding: '1.75rem 1.5rem 1.25rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              marginBottom: '0.75rem',
            }}
          >
            <ShieldCheck size={14} color="#93c5fd" /> RAVI VISION STORE
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.25 }}>
            {mode === 'login' ? 'Customer Account Login' : 'Customer Registration'}
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#bfdbfe', marginTop: '0.4rem', marginBottom: 0 }}>
            {mode === 'login'
              ? 'Enter your mobile number to view profile & track orders'
              : 'Register to unlock fast 1-day local delivery in Kargahar'}
          </p>

          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(15, 23, 42, 0.25)',
              borderRadius: '12px',
              padding: '4px',
              marginTop: '1.15rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '0.45rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? '#1e40af' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '0.45rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: mode === 'signup' ? '#ffffff' : 'transparent',
                color: mode === 'signup' ? '#1e40af' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: 'pointer',
              }}
            >
              New Registration
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {errorMsg && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.65rem 0.85rem', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.65rem 0.85rem', borderRadius: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Smartphone size={18} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
              >
                {submitting ? 'Verifying...' : <>Continue <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Smartphone size={18} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Delivery Pincode
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="6-digit pincode (e.g. 821107)"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.4rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.75rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
              >
                {submitting ? 'Creating Account...' : <>Complete Registration <ArrowRight size={16} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>}>
      <AccountPageContent />
    </Suspense>
  );
}
