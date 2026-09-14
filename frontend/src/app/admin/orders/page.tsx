'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { ShoppingBag, Search, Clock, MapPin, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderAdminData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    brand: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  statusHistory: Array<{
    id: string;
    previousStatus?: string;
    newStatus: string;
    changedBy: string;
    note?: string;
    createdAt: string;
  }>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderAdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch {
      console.error('Error fetching admin orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.error?.message || 'Failed to update order status.');
      }
    } catch {
      alert('Error updating status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            Order Fulfillment Manager
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Track order status timelines, manage payment verification, and fulfill local orders
          </p>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search Order #, Name, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.625rem 0.625rem 0.625rem 2.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', fontSize: '0.8125rem', outline: 'none' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading orders...</div>
        ) : orders.length > 0 ? (
          orders.map((o) => {
            const isExpanded = expandedId === o.id;
            return (
              <div key={o.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                        {o.orderNumber}
                      </span>
                      <span className="badge badge-info">{o.orderStatus}</span>
                      <span className={`badge ${o.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                        {o.paymentMethod} ({o.paymentStatus})
                      </span>
                    </div>

                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)' }}>
                      Customer: {o.customerName} | Phone: <strong>{o.customerPhone}</strong>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      Delivery Pincode: <strong>{o.pincode}</strong> ({o.city}, {o.state}) | Placed: {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                        {formatINR(o.totalAmount)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.items.length} items</div>
                    </div>

                    <select
                      value={o.orderStatus}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      style={{ padding: '0.375rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', fontWeight: 600 }}
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="PACKED">PACKED</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : o.id)}
                      className="btn btn-outline"
                      style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Items & Status Timeline */}
                {isExpanded && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                        Order Items Snapshot:
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                        {o.items.map((it) => (
                          <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', borderBottom: '1px dashed var(--border-light)' }}>
                            <span>{it.quantity}× {it.productName} ({it.brand} - {it.sku})</span>
                            <strong>{formatINR(it.totalPrice)}</strong>
                          </li>
                        ))}
                      </ul>

                      <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-body)' }}>
                        <strong>Full Shipping Address:</strong><br />
                        {o.shippingAddress}<br />
                        {o.landmark && `Landmark: ${o.landmark}, `}{o.city}, {o.state} - {o.pincode}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                        Status Audit Timeline:
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                        {o.statusHistory.map((hist) => (
                          <li key={hist.id} style={{ backgroundColor: '#f8fafc', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
                              Status changed to {hist.newStatus} by {hist.changedBy}
                            </div>
                            {hist.note && <div style={{ color: 'var(--text-body)', marginTop: '0.125rem' }}>{hist.note}</div>}
                            <div style={{ color: 'var(--text-muted)', marginTop: '0.125rem' }}>{new Date(hist.createdAt).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)' }}>
            No orders found.
          </div>
        )}
      </div>

    </div>
  );
}
