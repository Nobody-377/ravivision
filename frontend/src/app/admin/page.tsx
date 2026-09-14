import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getStoreConfig, checkConfigCompleteness } from '@/lib/store-config';
import { formatINR } from '@/lib/currency';
import { AlertTriangle, AlertCircle, ShoppingBag, Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default async function AdminDashboardPage() {
  const auth = await getAdminSession();
  if (!auth) {
    redirect('/admin/login');
  }

  const storeConfig = await getStoreConfig();
  const completeness = checkConfigCompleteness(storeConfig);

  // Check demo data count
  const demoProductCount = await prisma.product.count({
    where: { isDemoData: true },
  });

  // Calculate Real DB Order Metrics
  const totalOrders = await prisma.order.count();
  const pendingOrders = await prisma.order.count({
    where: { orderStatus: { in: ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'] } },
  });

  // Total Revenue from PAID or DELIVERED orders
  const revenueAgg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { paymentStatus: 'PAID' },
  });

  const totalRevenue = revenueAgg._sum.totalAmount ? revenueAgg._sum.totalAmount.toNumber() : 0;

  // Inventory Status
  const outOfStockCount = await prisma.product.count({ where: { stock: 0 } });
  const lowStockCount = await prisma.product.count({
    where: {
      stock: { gt: 0, lte: 2 },
    },
  });

  // Recent 10 Orders
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. DEMO DATA WARNING BANNER */}
      {demoProductCount > 0 && (
        <div style={{
          backgroundColor: '#fff7ed',
          border: '2px solid #fdba74',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          color: '#9a3412',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="#ea580c" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                DEMO DATA DETECTED ({demoProductCount} Products)
              </div>
              <div style={{ fontSize: '0.84375rem', marginTop: '0.125rem' }}>
                Demo catalog pricing and inventory are active for testing. Replace demo prices, stock, and SKU details before production launch.
              </div>
            </div>
          </div>
          <Link href="/admin/products" className="btn" style={{ backgroundColor: '#ea580c', color: '#ffffff', fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
            Manage Product SKUs
          </Link>
        </div>
      )}

      {/* 2. FIRST-RUN STORE SETUP BANNER */}
      {!completeness.isComplete && (
        <div className="setup-banner">
          <div>
            <div className="setup-banner-title">
              <AlertCircle size={20} /> Store Configuration Setup Incomplete
            </div>
            <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              Missing: <strong>{completeness.missingFields.join(', ')}</strong>. Configure these parameters to enable full storefront operation.
            </div>
          </div>
          <Link href="/admin/settings" className="btn btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>
            Complete Setup
          </Link>
        </div>
      )}

      {/* Dashboard Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Orders
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0.25rem 0' }}>
            {totalOrders}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Real database orders count
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Pending Orders
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--primary-blue)', margin: '0.25rem 0' }}>
            {pendingOrders}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Awaiting processing or delivery
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Confirmed Paid Revenue
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
            {formatINR(totalRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Verified payment revenue
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Stock Alerts
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', margin: '0.25rem 0' }}>
            {outOfStockCount} Out of Stock | {lowStockCount} Low
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Inventory threshold warnings
          </div>
        </div>
      </div>

      {/* Recent Orders Timeline */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          Recent Customer Orders
        </h3>

        {recentOrders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Order #</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Phone</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Pincode</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Method</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                      <Link href={`/admin/orders?order=${ord.orderNumber}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {ord.orderNumber}
                      </Link>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{ord.customerName}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{ord.customerPhone}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{ord.pincode}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{ord.paymentMethod}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{formatINR(ord.totalAmount)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="badge badge-info">{ord.orderStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>No orders yet</div>
            <div style={{ fontSize: '0.8125rem' }}>Real customer orders will appear here once placed on the storefront.</div>
          </div>
        )}
      </div>

    </div>
  );
}
