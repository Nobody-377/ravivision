'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  Clock,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    activeProducts: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Orders
      const resOrders = await fetch('/api/admin/orders');
      if (resOrders.ok) {
        const dataOrders = await resOrders.json();
        const rawOrders = dataOrders.data || [];
        setOrders(rawOrders);

        const rev = rawOrders.reduce((acc: number, o: any) => acc + Number(o.totalAmount || 0), 0);
        const pending = rawOrders.filter((o: any) => ['PLACED', 'CONFIRMED', 'PROCESSING'].includes(o.orderStatus)).length;
        
        setStats(prev => ({
          ...prev,
          totalRevenue: rev,
          totalOrders: rawOrders.length,
          pendingOrders: pending,
        }));
      }

      // Fetch Products for Inventory status
      const resProducts = await fetch('/api/admin/products');
      if (resProducts.ok) {
        const dataProducts = await resProducts.json();
        const rawProducts = dataProducts.data || [];
        setProducts(rawProducts);

        const lowStock = rawProducts.filter((p: any) => p.stock <= (p.lowStockThreshold || 2)).length;
        const active = rawProducts.filter((p: any) => p.status === 'ACTIVE').length;

        setStats(prev => ({
          ...prev,
          lowStockCount: lowStock,
          activeProducts: active,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader 
          title="Executive Dashboard" 
          subtitle="Real-time Store Operations & Inventory Overview" 
          onRefresh={fetchData}
          isRefreshing={loading}
        />
        
        <main className="admin-content animate-fade-in">
          {/* Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div>
                <span className="metric-label">Total Store Revenue</span>
                <div className="metric-val" style={{ color: '#059669' }}>
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={14} color="#059669" /> Real-time sales total
                </div>
              </div>
              <div className="metric-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <DollarSign size={24} />
              </div>
            </div>

            <div className="metric-card">
              <div>
                <span className="metric-label">Total Customer Orders</span>
                <div className="metric-val" style={{ color: '#2563eb' }}>
                  {stats.totalOrders}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {stats.pendingOrders} pending fulfillment
                </div>
              </div>
              <div className="metric-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <ShoppingBag size={24} />
              </div>
            </div>

            <div className="metric-card">
              <div>
                <span className="metric-label">Active Catalog Products</span>
                <div className="metric-val" style={{ color: '#7c3aed' }}>
                  {stats.activeProducts}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Ready for sellable stock
                </div>
              </div>
              <div className="metric-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Package size={24} />
              </div>
            </div>

            <div className="metric-card" style={{ borderColor: stats.lowStockCount > 0 ? '#fde68a' : 'var(--border-color)' }}>
              <div>
                <span className="metric-label">Low / Out of Stock Items</span>
                <div className="metric-val" style={{ color: stats.lowStockCount > 0 ? '#d97706' : '#059669' }}>
                  {stats.lowStockCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: stats.lowStockCount > 0 ? '#b45309' : '#64748b', marginTop: '0.25rem' }}>
                  {stats.lowStockCount > 0 ? 'Action required in inventory' : 'Stock levels healthy'}
                </div>
              </div>
              <div className="metric-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '12px', color: '#2563eb' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Manage & Track Orders</h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Update delivery status & customer details</p>
                  </div>
                </div>
                <ChevronRight size={20} color="#94a3b8" />
              </div>
            </Link>

            <Link href="/admin/inventory" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: '#f5f3ff', borderRadius: '12px', color: '#7c3aed' }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Update Inventory Stock</h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Adjust quantities & SKU prices</p>
                  </div>
                </div>
                <ChevronRight size={20} color="#94a3b8" />
              </div>
            </Link>
          </div>

          {/* Recent Customer Orders */}
          <div className="table-container">
            <div className="table-header-toolbar">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Recent Customer Orders</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Latest store orders with fulfillment status</p>
              </div>
              <Link href="/admin/orders" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                View All Orders <ArrowUpRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading store data...</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No customer orders placed yet.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer Name</th>
                    <th>Contact Phone</th>
                    <th>City / Pincode</th>
                    <th>Total Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{order.orderNumber}</td>
                      <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                      <td>{order.mobileNumber}</td>
                      <td>{order.city} ({order.pincode})</td>
                      <td style={{ fontWeight: 700, color: '#059669' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`badge ${order.paymentMode === 'ONLINE' ? 'badge-purple' : 'badge-blue'}`}>
                          {order.paymentMode}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          order.orderStatus === 'DELIVERED' ? 'badge-emerald' :
                          order.orderStatus === 'CANCELLED' ? 'badge-rose' : 'badge-amber'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
