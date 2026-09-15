'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  CheckCircle2, 
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
                <div className="metric-val" style={{ color: '#34d399' }}>
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <TrendingUp size={14} color="#34d399" /> Real-time sales total
                </div>
              </div>
              <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <DollarSign size={24} />
              </div>
            </div>

            <div className="metric-card">
              <div>
                <span className="metric-label">Total Customer Orders</span>
                <div className="metric-val" style={{ color: '#60a5fa' }}>
                  {stats.totalOrders}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  {stats.pendingOrders} pending fulfillment
                </div>
              </div>
              <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                <ShoppingBag size={24} />
              </div>
            </div>

            <div className="metric-card">
              <div>
                <span className="metric-label">Active Catalog Products</span>
                <div className="metric-val" style={{ color: '#c084fc' }}>
                  {stats.activeProducts}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Ready for sellable stock
                </div>
              </div>
              <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                <Package size={24} />
              </div>
            </div>

            <div className="metric-card" style={{ borderColor: stats.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)' }}>
              <div>
                <span className="metric-label">Low / Out of Stock Items</span>
                <div className="metric-val" style={{ color: stats.lowStockCount > 0 ? '#fbbf24' : '#34d399' }}>
                  {stats.lowStockCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: stats.lowStockCount > 0 ? '#fbbf24' : '#94a3b8', marginTop: '0.25rem' }}>
                  {stats.lowStockCount > 0 ? 'Action required in inventory' : 'Stock levels healthy'}
                </div>
              </div>
              <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <Link href="/orders" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Manage & Track Orders</h3>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Update delivery status & customer details</p>
                  </div>
                </div>
                <ChevronRight size={20} color="#64748b" />
              </div>
            </Link>

            <Link href="/inventory" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', color: '#c084fc' }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>Update Inventory Stock</h3>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Adjust quantities & SKU prices</p>
                  </div>
                </div>
                <ChevronRight size={20} color="#64748b" />
              </div>
            </Link>
          </div>

          {/* Recent Customer Orders */}
          <div className="table-container">
            <div className="table-header-toolbar">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Recent Customer Orders</h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Latest store orders with fulfillment status</p>
              </div>
              <Link href="/orders" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                View All Orders <ArrowUpRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading store data...</div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No customer orders placed yet.</div>
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
                      <td style={{ fontWeight: 700, color: '#38bdf8' }}>{order.orderNumber}</td>
                      <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                      <td>{order.mobileNumber}</td>
                      <td>{order.city} ({order.pincode})</td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</td>
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
