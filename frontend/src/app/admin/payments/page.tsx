'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { exportToExcel } from '@/lib/admin/excel-export';
import { 
  Search, 
  FileSpreadsheet, 
  Clock, 
  Edit3, 
  X,
  AlertTriangle
} from 'lucide-react';

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Manual Status Update
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('SUCCESS');
  const [failureMessage, setFailureMessage] = useState<string>('');
  const [adminNote, setAdminNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPaymentData = async () => {
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
    fetchPaymentData();
  }, []);

  const handleOpenEditModal = (order: any) => {
    setEditingOrder(order);
    const p = order.payments && order.payments.length > 0
      ? order.payments.find((pay: any) => pay.paymentStatus === 'SUCCESS') || order.payments[order.payments.length - 1]
      : null;
    
    setNewStatus(p?.paymentStatus || (order.paymentMode === 'COD' ? 'PENDING' : 'SUCCESS'));
    setFailureMessage(p?.failureMessage || '');
    setAdminNote('');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: newStatus,
          failureMessage: newStatus === 'FAILED' ? failureMessage || 'Payment marked as failed by store admin.' : failureMessage,
          note: adminNote || `Payment status updated to ${newStatus} by admin`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingOrder(null);
        fetchPaymentData();
      } else {
        alert(data.error?.message || 'Failed to update payment status.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating payment status.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPayments = orders.filter(o => {
    const q = searchTerm.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.razorpayOrderId?.toLowerCase().includes(q) ||
      o.paymentMode?.toLowerCase().includes(q)
    );
  });

  const handleExportExcel = () => {
    const reportData = filteredPayments.map(o => {
      const p = o.payments && o.payments.length > 0 ? o.payments[o.payments.length - 1] : null;
      const status = p?.paymentStatus || 'PENDING';
      return {
        'Order Number': o.orderNumber,
        'Customer Name': o.customerName,
        'Payment Mode': o.paymentMode,
        'Payment Method': p?.paymentMethod || (o.paymentMode === 'COD' ? 'COD' : 'ONLINE'),
        'Payment Type': p?.paymentType || 'ONE_TIME',
        'Payment Status': status,
        'Transaction ID': p?.transactionId || 'N/A',
        'Razorpay Order ID': o.razorpayOrderId || p?.razorpayOrderId || 'N/A (COD)',
        'Razorpay Payment ID': p?.razorpayPaymentId || 'N/A',
        'Razorpay Signature': p?.razorpaySignature || 'N/A',
        'Failure Message Log': p?.failureMessage || (status === 'FAILED' ? 'Payment failed' : 'None'),
        'Total Amount (₹)': Number(o.totalAmount),
        'Transaction Timestamp (IST)': new Date(p?.transactionAt || o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      };
    });
    exportToExcel('Payment_Reconciliation_Report', 'Payments', reportData);
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader 
          title="Payment & Gateway Audit Logs" 
          subtitle="Payment mode, COD cash updates, transaction IDs, Razorpay IDs, signatures & IST timestamps"
          onRefresh={fetchPaymentData}
          isRefreshing={loading}
        />

        <main className="admin-content animate-fade-in">
          <div className="table-container">
            <div className="table-header-toolbar">
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none', zIndex: 10 }} />
                <input
                  type="text"
                  placeholder="Search order #, Razorpay ID, payment mode..."
                  className="input-search"
                  style={{
                    paddingLeft: '2.6rem',
                    paddingRight: '1rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    height: '42px',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    minWidth: '340px',
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button onClick={handleExportExcel} className="btn btn-emerald" style={{ fontSize: '0.85rem' }}>
                <FileSpreadsheet size={16} /> Export Payments to Excel
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading payment logs...</div>
            ) : filteredPayments.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No payment records found.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer Name</th>
                    <th>Mode & Method</th>
                    <th>Type & Status</th>
                    <th>Razorpay / Transaction References</th>
                    <th>Amount (₹)</th>
                    <th>Timestamp (IST)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((o) => {
                    const p = o.payments && o.payments.length > 0
                      ? o.payments.find((pay: any) => pay.paymentStatus === 'SUCCESS') || o.payments[o.payments.length - 1]
                      : null;
                    const paymentStatus = p?.paymentStatus || 'PENDING';
                    const paymentMethod = p?.paymentMethod || (o.paymentMode === 'COD' ? 'COD' : 'ONLINE');
                    const paymentType = p?.paymentType || 'ONE_TIME';
                    
                    const istTimestamp = new Date(p?.transactionAt || o.createdAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    });

                    return (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{o.orderNumber}</td>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{o.customerName}</td>
                        <td>
                          <span className={`badge ${o.paymentMode === 'ONLINE' ? 'badge-purple' : 'badge-blue'}`}>
                            {o.paymentMode} ({paymentMethod})
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span className={`badge ${
                              paymentStatus === 'SUCCESS' ? 'badge-emerald' :
                              paymentStatus === 'FAILED' ? 'badge-rose' : 'badge-amber'
                            }`}>
                              {paymentStatus}
                            </span>
                            <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Type: {paymentType}</span>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.775rem', color: '#64748b' }}>
                          {o.razorpayOrderId ? (
                            <div>
                              <div style={{ color: '#2563eb' }}>RP Order: {o.razorpayOrderId}</div>
                              {p?.razorpayPaymentId && <div style={{ color: '#059669' }}>RP Pay: {p.razorpayPaymentId}</div>}
                              {p?.transactionId && <div style={{ color: '#7c3aed' }}>Txn: {p.transactionId}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>Cash on Delivery</span>
                          )}
                          {p?.failureMessage && (
                            <div style={{ color: '#be123c', fontSize: '0.775rem', fontWeight: 600, marginTop: '0.25rem', background: '#fff1f2', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <AlertTriangle size={13} /> Failure: {p.failureMessage}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 800, color: '#059669' }}>₹{Number(o.totalAmount).toLocaleString('en-IN')}</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {istTimestamp} IST
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleOpenEditModal(o)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Edit3 size={14} /> Update Status
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Manual Payment Status Update Modal */}
      {editingOrder && (
        <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Update Payment Status: {editingOrder.orderNumber}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#2563eb', marginTop: '0.15rem' }}>
                  Mode: {editingOrder.paymentMode} | Total Amount: ₹{Number(editingOrder.totalAmount).toLocaleString('en-IN')}
                </div>
              </div>
              <button onClick={() => setEditingOrder(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                  Select New Payment Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                >
                  <option value="SUCCESS">SUCCESS (Cash Received / Payment Verified)</option>
                  <option value="FAILED">FAILED (Payment Declined / Cash Refused)</option>
                  <option value="PENDING">PENDING (Awaiting Cash / Verification)</option>
                  <option value="CANCELLED">CANCELLED (Order/Payment Cancelled)</option>
                </select>
              </div>

              {newStatus === 'FAILED' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#be123c', marginBottom: '0.35rem' }}>
                    Payment Failure Reason *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Customer refused COD cash payment upon delivery"
                    value={failureMessage}
                    onChange={(e) => setFailureMessage(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#be123c',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                  Admin Note / Audit Log Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cash ₹24,999 collected physically by delivery driver John"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  {isSaving ? 'Updating Status...' : 'Save Payment Status'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
