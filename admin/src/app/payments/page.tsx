'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { exportToExcel } from '@/lib/excel-export';
import { Search, CreditCard, ShieldCheck, AlertCircle, FileSpreadsheet, CheckCircle2, Clock } from 'lucide-react';

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
      const p = o.payments && o.payments.length > 0 ? o.payments[0] : null;
      return {
        'Order Number': o.orderNumber,
        'Customer Name': o.customerName,
        'Payment Mode': o.paymentMode,
        'Payment Method': p?.paymentMethod || (o.paymentMode === 'COD' ? 'COD' : 'ONLINE'),
        'Payment Type': p?.paymentType || 'ONE_TIME',
        'Payment Status': p?.paymentStatus || (o.paymentMode === 'ONLINE' ? 'SUCCESS' : 'PENDING'),
        'Transaction ID': p?.transactionId || 'N/A',
        'Razorpay Order ID': o.razorpayOrderId || p?.razorpayOrderId || 'N/A (COD)',
        'Razorpay Payment ID': p?.razorpayPaymentId || 'N/A',
        'Razorpay Signature': p?.razorpaySignature || 'N/A',
        'Failure Message Log': p?.failureMessage || 'None',
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
          subtitle="Payment mode, payment method, payment type, transaction IDs, Razorpay IDs, signatures & IST timestamps"
          onRefresh={fetchPaymentData}
          isRefreshing={loading}
        />

        <main className="admin-content animate-fade-in">
          <div className="table-container">
            <div className="table-header-toolbar">
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search order #, Razorpay ID, payment mode..."
                  className="input-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button onClick={handleExportExcel} className="btn btn-emerald" style={{ fontSize: '0.85rem' }}>
                <FileSpreadsheet size={16} /> Export Payments to Excel
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading payment logs...</div>
            ) : filteredPayments.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No payment records found.</div>
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
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((o) => {
                    const p = o.payments && o.payments.length > 0 ? o.payments[0] : null;
                    const paymentStatus = p?.paymentStatus || (o.paymentMode === 'ONLINE' ? 'SUCCESS' : 'PENDING');
                    const paymentMethod = p?.paymentMethod || (o.paymentMode === 'COD' ? 'COD' : 'ONLINE');
                    const paymentType = p?.paymentType || 'ONE_TIME';
                    
                    const istTimestamp = new Date(p?.transactionAt || o.createdAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    });

                    return (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>{o.orderNumber}</td>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{o.customerName}</td>
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
                        <td style={{ fontFamily: 'monospace', fontSize: '0.775rem', color: '#94a3b8' }}>
                          {o.razorpayOrderId ? (
                            <div>
                              <div style={{ color: '#38bdf8' }}>RP Order: {o.razorpayOrderId}</div>
                              {p?.razorpayPaymentId && <div style={{ color: '#34d399' }}>RP Pay: {p.razorpayPaymentId}</div>}
                              {p?.transactionId && <div style={{ color: '#c084fc' }}>Txn: {p.transactionId}</div>}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>Cash on Delivery</span>
                          )}
                          {p?.failureMessage && (
                            <div style={{ color: '#f87171', fontSize: '0.725rem', marginTop: '0.2rem' }}>
                              ⚠️ Failure: {p.failureMessage}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 800, color: '#34d399' }}>₹{Number(o.totalAmount).toLocaleString('en-IN')}</td>
                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} /> {istTimestamp} IST
                          </div>
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
    </div>
  );
}
