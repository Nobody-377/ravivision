'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { exportToExcel } from '@/lib/excel-export';
import { 
  Search, 
  FileSpreadsheet, 
  MapPin, 
  Phone, 
  Mail, 
  Eye, 
  X,
  History,
  PackageCheck,
  User,
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
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Fetching customer orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No matching orders found.</div>
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
                      <td style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                        {order.orderNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={12} /> {order.mobileNumber}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{order.city}, {order.state || ''} - {order.pincode}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.address}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge ${order.paymentMode === 'ONLINE' ? 'badge-purple' : 'badge-blue'}`}>
                          {order.paymentMode}
                        </span>
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
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                  Order Audit: {selectedOrder.orderNumber}
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Customer Details Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>CUSTOMER CONTACT</div>
                <div style={{ fontWeight: 700, color: '#f8fafc', marginTop: '0.25rem' }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginTop: '0.15rem' }}>📞 {selectedOrder.mobileNumber}</div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>✉️ {selectedOrder.customerEmail || 'No email provided'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>DELIVERY LOCATION</div>
                <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: '0.25rem' }}>{selectedOrder.address}</div>
                {selectedOrder.landmark && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Landmark: {selectedOrder.landmark}</div>}
                <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600, marginTop: '0.15rem' }}>
                  {selectedOrder.city}, {selectedOrder.state || ''} - {selectedOrder.pincode}
                </div>
              </div>
            </div>

            {/* Ordered Items Breakdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.65rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PackageCheck size={16} /> Ordered Items Breakdown ({selectedOrder.items?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedOrder.items && selectedOrder.items.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(51, 65, 85, 0.4)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Brand: {item.brand || 'N/A'} | SKU: {item.sku || 'N/A'} | Unit Price: ₹{Number(item.unitPrice).toLocaleString('en-IN')} × {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                      ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Change History Audit Logs */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.65rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={16} /> Status Change History (`OrderStatusHistory` Audit Logs)
              </h4>
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.statusHistory.map((h: any) => (
                    <div key={h.id} style={{ background: 'rgba(15, 23, 42, 0.7)', borderLeft: '3px solid #3b82f6', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f8fafc', fontWeight: 600 }}>
                        <span>
                          {h.previousStatus ? `${h.previousStatus} ➔ ${h.newStatus}` : `Initial Status: ${h.newStatus}`}
                        </span>
                        <span style={{ color: '#94a3b8', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {new Date(h.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)
                        </span>
                      </div>
                      <div style={{ color: '#94a3b8', marginTop: '0.2rem' }}>
                        By: <span style={{ color: '#38bdf8' }}>{h.changedBy}</span> {h.note && `— Note: ${h.note}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', padding: '0.75rem', borderRadius: '8px' }}>
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
