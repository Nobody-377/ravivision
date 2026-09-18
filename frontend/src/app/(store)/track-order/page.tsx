'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  PhoneCall,
  ShieldCheck,
  AlertCircle,
  FileText,
  ShoppingBag,
  ArrowRight,
  User,
} from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { CallToOrderModal } from '@/components/call-to-order/CallToOrderModal';

interface MilestoneStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  timestamp: string | null;
}

interface OrderTrackingData {
  id: string;
  orderNumber: string;
  orderStatus: string;
  isCancelled: boolean;
  customerName: string;
  mobileNumber: string;
  customerEmail?: string;
  address: string;
  landmark?: string;
  pincode: string;
  city: string;
  state?: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  createdAt: string;
  milestones: MilestoneStep[];
  history: Array<{ status: string; note: string | null; timestamp: string }>;
  items: Array<{
    id: string;
    productName: string;
    brand: string | null;
    sku: string | null;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
  latestNote: string | null;
  storePhone: string;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const urlOrderNumber = searchParams.get('orderNumber') || '';
  const urlMobileNumber = searchParams.get('mobileNumber') || '';

  const [orderNumber, setOrderNumber] = useState(urlOrderNumber);
  const [mobileNumber, setMobileNumber] = useState(urlMobileNumber);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [callModalOpen, setCallModalOpen] = useState(false);

  const fetchTrackingData = async (ordNum: string, mobNum: string) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ordNum) params.set('orderNumber', ordNum.trim());
      if (mobNum) params.set('mobileNumber', mobNum.trim());

      const res = await fetch(`/api/orders/track?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setOrderData(data.data);
      } else {
        setOrderData(null);
        setErrorMsg(data.error?.message || 'No matching order found.');
      }
    } catch {
      setErrorMsg('Failed to fetch tracking data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlOrderNumber || urlMobileNumber) {
      fetchTrackingData(urlOrderNumber, urlMobileNumber);
    } else {
      // Attempt to load latest order if customer is logged in
      fetchTrackingData('', '');
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setErrorMsg('Please enter your Order Number.');
      return;
    }
    fetchTrackingData(orderNumber, mobileNumber);
  };

  const formatTimestamp = (tsStr: string | null) => {
    if (!tsStr) return 'Pending';
    try {
      return new Date(tsStr).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return tsStr;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem', maxWidth: '960px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '9999px', padding: '0.35rem 0.85rem', fontSize: '0.8125rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '0.75rem' }}>
          <Package size={16} color="#2563eb" /> LIVE ORDER FULFILLMENT TRACKER
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Track Your Order
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#64748b', maxWidth: '560px', margin: '0 auto' }}>
          Enter your Order Number and Mobile Number to view real-time store milestone updates & timestamps
        </p>
      </div>

      {/* Order Search Form */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.08)',
          marginBottom: '2rem',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) gap(1rem)', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
              Order Number
            </label>
            <input
              type="text"
              placeholder="e.g. RV-849201"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9375rem',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.375rem' }}>
              Mobile Number
            </label>
            <input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9375rem',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '0.9375rem',
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              height: '46px',
            }}
          >
            <Search size={18} /> {loading ? 'Searching...' : 'Track Order'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#be123c',
            borderRadius: '16px',
            padding: '1.25rem',
            fontSize: '0.9375rem',
            fontWeight: 600,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Tracking Result View */}
      {orderData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Order Header Summary Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ORDER REFERENCE
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0.15rem 0' }}>
                  {orderData.orderNumber}
                </h2>
                <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Placed on: <strong>{formatTimestamp(orderData.createdAt)}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor:
                      orderData.orderStatus === 'DELIVERED'
                        ? '#ecfdf5'
                        : orderData.orderStatus === 'CANCELLED'
                        ? '#fff1f2'
                        : '#eff6ff',
                    color:
                      orderData.orderStatus === 'DELIVERED'
                        ? '#047857'
                        : orderData.orderStatus === 'CANCELLED'
                        ? '#be123c'
                        : '#1d4ed8',
                    border:
                      orderData.orderStatus === 'DELIVERED'
                        ? '1px solid #a7f3d0'
                        : orderData.orderStatus === 'CANCELLED'
                        ? '1px solid #fecdd3'
                        : '1px solid #bfdbfe',
                  }}
                >
                  {orderData.orderStatus.replace(/_/g, ' ')}
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', marginTop: '0.5rem' }}>
                  {formatINR(orderData.totalAmount)}
                </div>
              </div>
            </div>

            {/* Store Contact & Direct Support Banner */}
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                  <PhoneCall size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e3a8a' }}>
                    Need Support? Store Phone: +91 {orderData.storePhone}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#3b82f6' }}>
                    Speak directly with Ravi Electronics store team for order updates
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCallModalOpen(true)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <PhoneCall size={16} /> Call Store Now
              </button>
            </div>

            {/* Visual Milestone Timeline Bar */}
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>
              Delivery Milestone Timeline
            </h3>

            {orderData.isCancelled ? (
              <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '1rem 1.25rem', color: '#be123c', fontWeight: 700, fontSize: '0.9375rem' }}>
                ⚠️ This order has been cancelled by the store or customer.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', position: 'relative' }}>
                {orderData.milestones.map((step, idx) => {
                  const isCompleted = step.completed;
                  return (
                    <div
                      key={step.key}
                      style={{
                        backgroundColor: isCompleted ? '#f8fafc' : '#ffffff',
                        border: isCompleted ? '2px solid #2563eb' : '1px dashed #cbd5e1',
                        borderRadius: '14px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isCompleted ? '#2563eb' : '#94a3b8' }}>
                            STEP 0{idx + 1}
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 size={18} color="#2563eb" />
                          ) : (
                            <Clock size={18} color="#cbd5e1" />
                          )}
                        </div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: isCompleted ? '#0f172a' : '#94a3b8', lineHeight: 1.2 }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          {step.description}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>TIMESTAMP</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isCompleted ? '#1e293b' : '#94a3b8' }}>
                          {formatTimestamp(step.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grid Layout: Stored Customer Info & Order Items */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            
            {/* Customer & Address Details (Auto-populated from DB) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} color="#2563eb" /> Delivery Address & Contact
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>CUSTOMER NAME</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.9375rem' }}>{orderData.customerName}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>MOBILE NUMBER</span>
                  <strong style={{ color: '#2563eb' }}>📞 {orderData.mobileNumber}</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>SERVICEABLE PINCODE</span>
                  <strong style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem' }}>
                    📍 {orderData.pincode} ({orderData.city})
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, display: 'block' }}>FULL ADDRESS</span>
                  <div style={{ color: '#334155', lineHeight: 1.4, marginTop: '0.2rem' }}>
                    {orderData.address}
                    {orderData.landmark && <><br /><em style={{ color: '#64748b' }}>Landmark: {orderData.landmark}</em></>}
                    <br />
                    {orderData.city}, {orderData.state || 'Bihar'} - {orderData.pincode}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Order Summary */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#2563eb" /> Payment & Financial Breakdown
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode</span>
                  <strong style={{ color: '#0f172a' }}>{orderData.paymentMode === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Payment Status</span>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    backgroundColor: orderData.paymentStatus === 'SUCCESS' ? '#ecfdf5' : '#fffbeb',
                    color: orderData.paymentStatus === 'SUCCESS' ? '#047857' : '#b45309',
                    border: orderData.paymentStatus === 'SUCCESS' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                  }}>
                    {orderData.paymentStatus === 'SUCCESS' ? 'PAID' : 'PAYABLE ON DELIVERY'}
                  </span>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Items Subtotal</span>
                  <strong style={{ color: '#0f172a' }}>{formatINR(orderData.subtotal)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Local Delivery Charge</span>
                  <strong style={{ color: '#059669' }}>
                    {orderData.deliveryCharge === 0 ? 'FREE Local Delivery' : formatINR(orderData.deliveryCharge)}
                  </strong>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800 }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#2563eb' }}>{formatINR(orderData.totalAmount)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Ordered Items List */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '1.5rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} color="#2563eb" /> Ordered Products ({orderData.items.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {orderData.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                      {item.brand || 'Ravi Electronics'}
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>
                      {item.productName}
                    </div>
                    {item.sku && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SKU: {item.sku}</div>}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatINR(item.totalPrice)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Qty: {item.quantity} × {formatINR(item.unitPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Audit Logs */}
          {orderData.history && orderData.history.length > 0 && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                Store Fulfillment Audit Log
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orderData.history.map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', padding: '0.6rem 0.85rem', borderBottom: idx < orderData.history.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <strong style={{ color: '#1e293b' }}>{log.status.replace(/_/g, ' ')}</strong>
                      {log.note && <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>— {log.note}</span>}
                    </div>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{formatTimestamp(log.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Call to Store Modal */}
      <CallToOrderModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        phone={orderData?.storePhone || '9631410611'}
        storeName="Ravi Electronics"
        openingHours="24/7 Open"
      />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '4rem 1rem' }}>Loading tracking portal...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
