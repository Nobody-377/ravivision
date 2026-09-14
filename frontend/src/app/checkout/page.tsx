'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PhoneCall, CreditCard, Banknote, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { CallToOrderModal } from '@/components/call-to-order/CallToOrderModal';

interface CartData {
  id?: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    brand: string;
    sku: string;
    price: number;
    quantity: number;
    itemTotal: number;
  }>;
  subtotal: number;
}

type PaymentState =
  | 'idle'
  | 'creating_order'
  | 'razorpay_open'
  | 'processing'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'cancelled';

function CheckoutContent() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [cart, setCart] = useState<CartData | null>(null);
  const [storePhone, setStorePhone] = useState('');
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'error' | 'warning'; message: string } | null>(null);

  // Synchronous client lock guard to prevent rapid click duplicates
  const isLockedRef = useRef(false);
  const checkoutSessionIdRef = useRef<string>('');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Pincode Verification State
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [oneDayAvailable, setOneDayAvailable] = useState(false);
  const [pincodeError, setPincodeError] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [callModalOpen, setCallModalOpen] = useState(false);

  useEffect(() => {
    // Dynamically load Razorpay Checkout Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    fetch('/api/cart')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.items.length > 0) {
          setCart(data.data);
          if (!checkoutSessionIdRef.current) {
            checkoutSessionIdRef.current = data.data.id || `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          }
        } else {
          router.push('/cart');
        }
      })
      .catch(() => router.push('/cart'))
      .finally(() => setLoading(false));
  }, [router]);

  const verifyPincode = async () => {
    if (!pincode || pincode.trim().length !== 6) {
      setPincodeError('Please enter a valid 6-digit pincode.');
      return;
    }

    setPincodeError('');
    try {
      const res = await fetch(`/api/pincode/check?pincode=${encodeURIComponent(pincode.trim())}`);
      const data = await res.json();
      if (data.success && data.data.isServiceable) {
        setDeliveryCharge(data.data.deliveryCharge);
        setOneDayAvailable(data.data.oneDayDelivery);
        setPincodeChecked(true);
      } else {
        setPincodeError(data.data?.message || 'Online delivery is currently unavailable for this pincode.');
        setPincodeChecked(false);
      }
    } catch {
      setPincodeError('Unable to check pincode at this time.');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeChecked) {
      alert('Please check pincode delivery availability first.');
      return;
    }

    // Synchronous mutex lock: prevent multiple rapid clicks / form submissions
    if (isLockedRef.current) {
      console.warn('[Checkout Lock] Request ignored: payment is already in progress for session', checkoutSessionIdRef.current);
      return;
    }

    isLockedRef.current = true;
    setSubmitting(true);
    setPaymentNotice(null);

    try {
      if (paymentMethod === 'COD') {
        setPaymentState('processing');
        const res = await fetch('/api/checkout/cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName,
            customerPhone,
            customerEmail,
            shippingAddress,
            landmark,
            city,
            state,
            pincode,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setPaymentState('success');
          router.push(`/order-confirmation/${data.data.orderNumber}`);
        } else {
          isLockedRef.current = false;
          setSubmitting(false);
          setPaymentState('failed');
          setPaymentNotice({ type: 'error', message: data.error?.message || 'Failed to place COD order.' });
        }
      } else {
        // Razorpay Online Payment Flow
        setPaymentState('creating_order');

        const payloadItems = cart?.items.map((i) => ({
          productId: i.productId || i.id,
          quantity: i.quantity,
        })) || [];

        const res = await fetch('/api/checkout/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName,
            customerPhone,
            customerEmail,
            shippingAddress,
            landmark,
            city,
            state,
            pincode,
            items: payloadItems,
            checkoutSessionId: checkoutSessionIdRef.current,
          }),
        });

        const data = await res.json();
        if (!data.success || !data.data) {
          isLockedRef.current = false;
          setSubmitting(false);
          setPaymentState('failed');
          setPaymentNotice({ type: 'error', message: data.error?.message || 'Failed to initialize Razorpay payment.' });
          return;
        }

        const { keyId, razorpayOrder, orderNumber } = data.data;

        if (!(window as any).Razorpay) {
          isLockedRef.current = false;
          setSubmitting(false);
          setPaymentState('failed');
          setPaymentNotice({ type: 'error', message: 'Razorpay SDK failed to load. Please refresh the page.' });
          return;
        }

        setPaymentState('razorpay_open');

        const options = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || 'INR',
          name: 'Ravi Vision',
          description: `Order #${orderNumber}`,
          order_id: razorpayOrder.id,
          prefill: {
            name: customerName,
            contact: customerPhone,
            email: customerEmail || undefined,
          },
          theme: { color: '#093680' },
          handler: async function (response: any) {
            setPaymentState('verifying');
            try {
              const verifyRes = await fetch('/api/checkout/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderNumber,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setPaymentState('success');
                router.push(`/order-confirmation/${orderNumber}`);
              } else {
                isLockedRef.current = false;
                setSubmitting(false);
                setPaymentState('failed');
                setPaymentNotice({ type: 'error', message: verifyData.error?.message || 'Payment verification failed.' });
              }
            } catch {
              isLockedRef.current = false;
              setSubmitting(false);
              setPaymentState('failed');
              setPaymentNotice({ type: 'error', message: 'Error verifying payment with server.' });
            }
          },
          modal: {
            ondismiss: function () {
              isLockedRef.current = false;
              setSubmitting(false);
              setPaymentState('cancelled');
              setPaymentNotice({ type: 'warning', message: 'Payment was cancelled. You can try again or choose Cash on Delivery.' });
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          isLockedRef.current = false;
          setSubmitting(false);
          setPaymentState('failed');
          setPaymentNotice({ type: 'error', message: response.error?.description || 'Razorpay payment failed. Please try again.' });
        });
        rzp.open();
      }
    } catch {
      isLockedRef.current = false;
      setSubmitting(false);
      setPaymentState('failed');
      setPaymentNotice({ type: 'error', message: 'Error connecting to server.' });
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Preparing guest checkout...
        </div>
      </div>
    );
  }

  const subtotal = cart?.subtotal || 0;
  const totalAmount = subtotal + deliveryCharge;

  const isPaymentActive = paymentState !== 'idle' && paymentState !== 'failed' && paymentState !== 'cancelled' && paymentState !== 'success';

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      
      {isPaymentActive && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#1e40af',
        }}>
          <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <div>
            <div style={{ fontWeight: 700 }}>Payment is being processed. Please wait.</div>
            <div style={{ fontSize: '0.875rem' }}>Do not click again or refresh the browser window while payment is processing.</div>
          </div>
        </div>
      )}

      {paymentNotice && (
        <div style={{
          backgroundColor: paymentNotice.type === 'error' ? '#fef2f2' : '#fff7ed',
          border: `1px solid ${paymentNotice.type === 'error' ? '#fca5a5' : '#fdba74'}`,
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: paymentNotice.type === 'error' ? '#991b1b' : '#c2410c',
        }}>
          <AlertCircle size={22} />
          <div>
            <div style={{ fontWeight: 700 }}>{paymentNotice.type === 'error' ? 'Payment Error' : 'Payment Notice'}</div>
            <div style={{ fontSize: '0.875rem' }}>{paymentNotice.message}</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/cart" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            Guest Checkout
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            No account required for placing local orders
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(320px, 380px)', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left: Customer Details Form */}
        <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Step 1: Customer Contact */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
              1. Customer Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.375rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="e.g. Rajesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.375rem' }}>
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  disabled={submitting}
                  placeholder="10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.375rem' }}>
                Email Address (Optional)
              </label>
              <input
                type="email"
                disabled={submitting}
                placeholder="For digital order receipt"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
              />
            </div>
          </div>

          {/* Step 2: Shipping Address & Pincode */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
              2. Delivery Address & Pincode Verification
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.375rem' }}>
                Serviceable Pincode *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  maxLength={6}
                  required
                  disabled={submitting}
                  placeholder="Enter 6-digit pincode"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''));
                    setPincodeChecked(false);
                  }}
                  style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={verifyPincode}
                  className="btn btn-primary"
                  style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}
                >
                  Verify Pincode
                </button>
              </div>

              {pincodeChecked && (
                <div style={{ fontSize: '0.8125rem', color: '#16a34a', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{oneDayAvailable ? '⚡ One-day local delivery confirmed!' : '✓ Local delivery confirmed!'} (Delivery Fee: ₹{deliveryCharge})</span>
                </div>
              )}

              {pincodeError && (
                <div style={{ fontSize: '0.8125rem', color: '#dc2626', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <AlertCircle size={16} />
                  <span>{pincodeError}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.375rem' }}>
                Street Address *
              </label>
              <textarea
                required
                rows={2}
                disabled={submitting}
                placeholder="House No., Building, Street Name"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.375rem' }}>
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  disabled={submitting}
                  placeholder="e.g. Near Bus Stand"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.375rem' }}>
                  City *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="City Name"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.375rem' }}>
                  State *
                </label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  placeholder="State Name"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Payment Method */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
              3. Select Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '1rem',
                border: paymentMethod === 'COD' ? '2px solid var(--primary-blue)' : '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: paymentMethod === 'COD' ? '#eff6ff' : '#ffffff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}>
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  disabled={submitting}
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <Banknote size={24} color="var(--primary-blue)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Cash on Delivery (COD)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pay in cash upon physical delivery by our store delivery team</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '1rem',
                border: paymentMethod === 'RAZORPAY' ? '2px solid var(--primary-blue)' : '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: paymentMethod === 'RAZORPAY' ? '#eff6ff' : '#ffffff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}>
                <input
                  type="radio"
                  name="payment"
                  value="RAZORPAY"
                  disabled={submitting}
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                />
                <CreditCard size={24} color="var(--primary-blue)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Online Payment (Razorpay)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UPI (GPay/PhonePe), Credit/Debit Cards, Net Banking, Wallets</div>
                </div>
              </label>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setCallModalOpen(true)}
                className="btn btn-outline"
                style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}
              >
                <PhoneCall size={18} color="#16a34a" /> Prefer ordering over phone? Call Ravi Vision
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !pincodeChecked}
            className="btn btn-primary"
            style={{
              padding: '1rem',
              fontSize: '1.0625rem',
              width: '100%',
              opacity: submitting || !pincodeChecked ? 0.75 : 1,
              cursor: submitting || !pincodeChecked ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                <span>
                  {paymentState === 'creating_order'
                    ? 'Creating Payment Order...'
                    : paymentState === 'razorpay_open'
                    ? 'Payment Gateway Open...'
                    : paymentState === 'verifying'
                    ? 'Verifying Payment...'
                    : 'Processing Order... Please wait.'}
                </span>
              </>
            ) : paymentMethod === 'RAZORPAY' ? (
              `Pay Online via Razorpay (${formatINR(totalAmount)})`
            ) : (
              `Place COD Order (${formatINR(totalAmount)})`
            )}
          </button>
        </form>

        {/* Right: Checkout Items Summary */}
        <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '90px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
            Cart Items ({cart?.items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {cart?.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.quantity} × {formatINR(item.price)}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
                  {formatINR(item.itemTotal)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <strong>{formatINR(subtotal)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery Fee</span>
              <strong>{pincodeChecked ? (deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)) : 'Pending Pincode'}</strong>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Total Payable</span>
              <span style={{ color: 'var(--primary-blue)' }}>{formatINR(totalAmount)}</span>
            </div>
          </div>
        </div>

      </div>

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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
