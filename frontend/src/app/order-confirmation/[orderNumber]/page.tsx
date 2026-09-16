import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/currency';
import { getStoreConfig } from '@/lib/store-config';
import { CheckCircle2, Package, MapPin, Phone, Home } from 'lucide-react';

import { cookies } from 'next/headers';

interface OrderConfirmationProps {
  params: Promise<{
    orderNumber: string;
  }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const { orderNumber } = await params;
  const cookieStore = await cookies();
  const hasAccessCookie = cookieStore.get(`ravi_order_access_${orderNumber}`)?.value === 'verified';

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) {
    notFound();
  }

  const storeConfig = await getStoreConfig();
  const primaryPayment = order.payments[0];

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '800px' }}>
      
      {/* Confirmation Header Banner */}
      <div className="card" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#ffffff', marginBottom: '2rem' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}>
          <CheckCircle2 size={36} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
          Order Successfully Placed!
        </h1>
        
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Thank you, <strong>{order.customerName}</strong>. Your order has been received by the Ravi Vision store team.
        </p>

        <div style={{
          display: 'inline-flex',
          gap: '1rem',
          backgroundColor: 'var(--surface-subtle)',
          padding: '0.75rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9375rem',
          fontWeight: 700,
        }}>
          <span>Order Number: <strong style={{ color: 'var(--primary-blue)' }}>{order.orderNumber}</strong></span>
          <span>Payment: <strong style={{ color: primaryPayment?.paymentStatus === 'SUCCESS' ? '#16a34a' : primaryPayment?.paymentStatus === 'FAILED' ? '#dc2626' : '#ea580c' }}>{order.paymentMode} ({primaryPayment?.paymentStatus || 'PENDING'})</strong></span>
        </div>

        {primaryPayment?.failureMessage && (
          <div style={{ marginTop: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600 }}>
            ⚠️ Payment Failure Details: {primaryPayment.failureMessage}
          </div>
        )}
      </div>

      {/* Order Details & Items Snapshot */}
      <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
          Order Items Summary
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                {item.brand && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                    {item.brand}
                  </div>
                )}
                <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                  {item.productName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Qty: {item.quantity} × {formatINR(item.unitPrice)}
                </div>
              </div>

              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                {formatINR(item.totalPrice)}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <strong>{formatINR(order.subtotal)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Local Delivery Charge</span>
            <strong>{order.deliveryCharge.toNumber() === 0 ? 'FREE' : formatINR(order.deliveryCharge)}</strong>
          </div>
          <div style={{ borderTop: '1px solid var(--border-strong)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800 }}>
            <span>Total Amount</span>
            <span style={{ color: 'var(--primary-blue)' }}>{formatINR(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={18} color="var(--primary-blue)" /> Delivery Destination
        </h3>
        {hasAccessCookie ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            <strong>{order.customerName}</strong> ({order.mobileNumber})<br />
            {order.address}<br />
            {order.landmark && `Landmark: ${order.landmark}, `}{order.city}, {order.state} - <strong>{order.pincode}</strong>
          </p>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
            <strong>{order.customerName}</strong> (***-***-{order.mobileNumber.slice(-4)})<br />
            <em>Address masked for customer privacy.</em><br />
            {order.city}, {order.state} - <strong>{order.pincode}</strong>
          </p>
        )}
      </div>

      {/* Call Store Action & Back Home */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {storeConfig.phone ? (
          <a href={`tel:${storeConfig.phone}`} className="btn btn-phone" style={{ textDecoration: 'none' }}>
            <Phone size={18} /> Call Store ({storeConfig.phone})
          </a>
        ) : (
          <Link href="/products" className="btn btn-primary">
            <Package size={18} /> Continue Shopping
          </Link>
        )}

        <Link href="/" className="btn btn-outline">
          <Home size={18} /> Return to Homepage
        </Link>
      </div>

    </div>
  );
}
