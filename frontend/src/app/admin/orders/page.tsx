'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { exportToExcel } from '@/lib/admin/excel-export';
import { 
  Search, 
  FileSpreadsheet, 
  Phone, 
  Eye, 
  X,
  History,
  PackageCheck,
  Clock
} from 'lucide-react';

const ORDER_STATUS_OPTIONS = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string>('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: statusNote || `Status updated to ${newStatus}` }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        const updatedOrder = updatedData.data;
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        setStatusNote('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaymentStatusUpdate = async (orderId: string, newPaymentStatus: string, reason?: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: newPaymentStatus,
          failureMessage: reason,
          note: reason || `Payment status manually changed to ${newPaymentStatus} by store admin.`,
        }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        const updatedOrder = updatedData.data;
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.mobileNumber?.includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.pincode?.includes(q) ||
      o.orderStatus?.toLowerCase().includes(q)
    );
  });

  const handleExportExcel = () => {
    const reportData = filteredOrders.map(o => ({
      'Order Number': o.orderNumber,
      'Customer Name': o.customerName,
      'Mobile Number': o.mobileNumber,
      'Email': o.customerEmail || 'N/A',
      'Address': o.address,
      'Landmark': o.landmark || 'N/A',
      'City': o.city,
      'State': o.state || 'N/A',
      'Pincode': o.pincode,
      'Current Order Status': o.orderStatus,
      'Status History Logs Count': o.statusHistory?.length || 0,
      'Payment Mode': o.paymentMode,
      'Subtotal (₹)': Number(o.subtotal),
      'Delivery Charge (₹)': Number(o.deliveryCharge),
      'Total Amount (₹)': Number(o.totalAmount),
      'Razorpay Order ID': o.razorpayOrderId || 'N/A',
      'Order Placed Date (IST)': new Date(o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }));
    exportToExcel('Orders_Master_Tracking_Report', 'Orders', reportData);
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader 
          title="Orders & Fulfillment Audit" 
          subtitle="Order Numbers, live status tracking, status change history audit logs & item breakdowns"
          onRefresh={fetchOrders}
          isRefreshing={loading}
        />

        <main className="admin-content animate-fade-in">
          <div className="table-container">
            <div className="table-header-toolbar">
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search order #, customer, status, pincode..."
                  className="input-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={handleExportExcel} className="btn btn-emerald" style={{ fontSize: '0.85rem' }}>
                  <FileSpreadsheet size={16} /> Export Orders to Excel
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Fetching customer orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No matching orders found.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer & Contact</th>
                    <th>Delivery Location</th>
                    <th>Total (₹)</th>
                    <th>Payment</th>
                    <th>Current Order Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                        {order.orderNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={12} /> {order.mobileNumber}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#0f172a' }}>{order.city}, {order.state || ''} - {order.pincode}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.address}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td>
                        {(() => {
                          const p = order.payments && order.payments.length > 0
                            ? order.payments.find((pay: any) => pay.paymentStatus === 'SUCCESS') || order.payments[order.payments.length - 1]
                            : null;
                          const pStatus = p?.paymentStatus || 'PENDING';
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <span className={`badge ${order.paymentMode === 'ONLINE' ? 'badge-purple' : 'badge-blue'}`}>
                                {order.paymentMode}
                              </span>
                              <span className={`badge ${
                                pStatus === 'SUCCESS' ? 'badge-emerald' :
                                pStatus === 'FAILED' ? 'badge-rose' : 'badge-amber'
                              }`} style={{ fontSize: '0.7rem' }}>
                                {pStatus}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <select
                          className="select-status"
                          value={order.orderStatus}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          {ORDER_STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <Eye size={14} /> Audit Trail & Items
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Order Details & Status Audit Trail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Order Audit: {selectedOrder.orderNumber}
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Customer Details & Payment Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CUSTOMER CONTACT</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: '0.85rem', color: '#2563eb', marginTop: '0.15rem' }}>📞 {selectedOrder.mobileNumber}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>✉️ {selectedOrder.customerEmail || 'No email provided'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DELIVERY LOCATION</div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', marginTop: '0.25rem' }}>{selectedOrder.address}</div>
                {selectedOrder.landmark && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Landmark: {selectedOrder.landmark}</div>}
                <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, marginTop: '0.15rem' }}>
                  {selectedOrder.city}, {selectedOrder.state || ''} - {selectedOrder.pincode}
                </div>
              </div>
            </div>

            {/* Payment Summary & Failure Log */}
            {(() => {
              const p = selectedOrder.payments && selectedOrder.payments.length > 0
                ? selectedOrder.payments.find((pay: any) => pay.paymentStatus === 'SUCCESS') || selectedOrder.payments[selectedOrder.payments.length - 1]
                : null;
              const status = p?.paymentStatus || 'PENDING';
              return (
                <div style={{ marginBottom: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Payment Gateway Status
                    </div>
                    <span className={`badge ${
                      status === 'SUCCESS' ? 'badge-emerald' :
                      status === 'FAILED' ? 'badge-rose' : 'badge-amber'
                    }`}>
                      {status} ({selectedOrder.paymentMode})
                    </span>
                  </div>
                  {p?.razorpayOrderId && <div style={{ fontSize: '0.8rem', color: '#2563eb', fontFamily: 'monospace' }}>Razorpay Order ID: {p.razorpayOrderId}</div>}
                  {p?.razorpayPaymentId && <div style={{ fontSize: '0.8rem', color: '#059669', fontFamily: 'monospace' }}>Razorpay Payment ID: {p.razorpayPaymentId}</div>}
                  {p?.failureMessage && (
                    <div style={{ marginTop: '0.5rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                      ⚠️ Failure Reason: {p.failureMessage}
                    </div>
                  )}

                  {/* Manual Payment Status Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Update Payment:</span>
                    <button
                      disabled={updatingId === selectedOrder.id}
                      onClick={() => handlePaymentStatusUpdate(selectedOrder.id, 'SUCCESS', 'Payment marked as SUCCESS / Cash Collected by store admin.')}
                      className="btn btn-emerald"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      ✓ Mark SUCCESS (Paid / Cash Collected)
                    </button>
                    <button
                      disabled={updatingId === selectedOrder.id}
                      onClick={() => {
                        const reason = prompt('Enter payment failure reason:', 'Customer refused COD cash payment upon delivery');
                        if (reason !== null) {
                          handlePaymentStatusUpdate(selectedOrder.id, 'FAILED', reason || 'Marked as FAILED by store admin');
                        }
                      }}
                      style={{
                        background: '#fff1f2',
                        border: '1px solid #fecdd3',
                        color: '#be123c',
                        borderRadius: '6px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      ✕ Mark FAILED
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Ordered Items Breakdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.65rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PackageCheck size={16} /> Ordered Items Breakdown ({selectedOrder.items?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedOrder.items && selectedOrder.items.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Brand: {item.brand || 'N/A'} | SKU: {item.sku || 'N/A'} | Unit Price: ₹{Number(item.unitPrice).toLocaleString('en-IN')} × {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>
                      ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Change History Audit Logs */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '0.65rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={16} /> Status Change History (`OrderStatusHistory` Audit Logs)
              </h4>
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.statusHistory.map((h: any) => (
                    <div key={h.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #2563eb', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a', fontWeight: 600 }}>
                        <span>
                          {h.previousStatus ? `${h.previousStatus} ➔ ${h.newStatus}` : `Initial Status: ${h.newStatus}`}
                        </span>
                        <span style={{ color: '#64748b', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {new Date(h.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
                        </span>
                      </div>
                      <div style={{ color: '#64748b', marginTop: '0.2rem' }}>
                        By: <span style={{ color: '#2563eb', fontWeight: 600 }}>{h.changedBy}</span> {h.note && `— Note: ${h.note}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                  Initial order state: {selectedOrder.orderStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
