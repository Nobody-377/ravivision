'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { exportToExcel } from '@/lib/excel-export';
import { 
  FileSpreadsheet, 
  Download, 
  ShoppingBag, 
  Package, 
  Users, 
  CreditCard,
  CheckCircle2
} from 'lucide-react';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const triggerExport = async (type: string) => {
    setDownloading(type);
    setSuccessMsg(null);

    try {
      if (type === 'orders') {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        const raw = data.data || [];
        const report = raw.map((o: any) => ({
          'Order Number': o.orderNumber,
          'Customer Name': o.customerName,
          'Mobile Number': o.mobileNumber,
          'Email': o.customerEmail || 'N/A',
          'Delivery Address': o.address,
          'City': o.city,
          'Pincode': o.pincode,
          'Order Status': o.orderStatus,
          'Payment Mode': o.paymentMode,
          'Subtotal (₹)': Number(o.subtotal),
          'Delivery Charge (₹)': Number(o.deliveryCharge),
          'Total Amount (₹)': Number(o.totalAmount),
          'Razorpay Order ID': o.razorpayOrderId || 'N/A',
          'Order Timestamp': new Date(o.createdAt).toLocaleString(),
        }));
        exportToExcel('Orders_Master_Report', 'Orders', report);
      } else if (type === 'inventory') {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        const raw = data.data || [];
        const report = raw.map((p: any) => ({
          'SKU Code': p.sku,
          'Product Name': p.name,
          'Brand': p.brand,
          'Stock Count': p.stock,
          'Low Stock Limit': p.lowStockThreshold || 2,
          'Status': p.status,
          'MRP (₹)': Number(p.mrp),
          'Price (₹)': Number(p.price),
          'Installation Required': p.requiresInstallation ? 'Yes' : 'No',
        }));
        exportToExcel('Inventory_Stock_Audit_Report', 'Inventory', report);
      } else if (type === 'customers') {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        const raw = data.data || [];

        const map = new Map<string, any>();
        raw.forEach((o: any) => {
          const key = o.mobileNumber || o.customerEmail || o.customerName;
          if (!map.has(key)) {
            map.set(key, {
              customerId: o.userId || `CUST-${o.id.substring(0, 8)}`,
              name: o.customerName,
              mobile: o.mobileNumber,
              email: o.customerEmail || 'N/A',
              city: o.city,
              pincode: o.pincode,
              address: o.address,
              ordersCount: 1,
              totalSpent: Number(o.totalAmount || 0),
            });
          } else {
            const existing = map.get(key);
            existing.ordersCount += 1;
            existing.totalSpent += Number(o.totalAmount || 0);
          }
        });

        exportToExcel('Customer_Directory_Report', 'Customers', Array.from(map.values()));
      } else if (type === 'payments') {
        const res = await fetch('/api/admin/orders');
        const data = await res.json();
        const raw = data.data || [];
        const report = raw.map((o: any) => ({
          'Order Number': o.orderNumber,
          'Customer Name': o.customerName,
          'Payment Mode': o.paymentMode,
          'Total Amount (₹)': Number(o.totalAmount),
          'Razorpay Order ID': o.razorpayOrderId || 'N/A (COD)',
          'Order Status': o.orderStatus,
          'Timestamp': new Date(o.createdAt).toLocaleString(),
        }));
        exportToExcel('Payment_Reconciliation_Report', 'Payments', report);
      }

      setSuccessMsg(`Successfully generated ${type.toUpperCase()} Excel sheet!`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader 
          title="Excel Report Export Center" 
          subtitle="Generate and download offline Excel (.xlsx) reports for accounting, stock audits & customer analytics"
        />

        <main className="admin-content animate-fade-in">
          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              fontWeight: 600,
              marginBottom: '2rem',
            }}>
              <CheckCircle2 size={20} />
              <span>{successMsg}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Orders Report Card */}
            <div className="table-container" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '14px', color: '#60a5fa' }}>
                  <ShoppingBag size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Orders Master Report</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Complete tracking of customer orders, addresses & status</p>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Includes Order #, Customer Name, Mobile, Email, Delivery Address, Pincode, Payment Mode, Status, Subtotal, Delivery Fee & Total.
              </p>
              <button
                onClick={() => triggerExport('orders')}
                disabled={downloading === 'orders'}
                className="btn btn-primary"
                style={{ marginTop: 'auto', padding: '0.75rem' }}
              >
                <Download size={18} /> {downloading === 'orders' ? 'Generating Excel...' : 'Download Orders Excel (.xlsx)'}
              </button>
            </div>

            {/* Inventory Report Card */}
            <div className="table-container" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '14px', color: '#c084fc' }}>
                  <Package size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Inventory Stock Audit</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Product catalog stock counts & price audit</p>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Includes SKU Code, Product Title, Brand, Current Stock Quantity, Low Stock Warning Limits, MRP, Sale Price & Installation status.
              </p>
              <button
                onClick={() => triggerExport('inventory')}
                disabled={downloading === 'inventory'}
                className="btn btn-emerald"
                style={{ marginTop: 'auto', padding: '0.75rem' }}
              >
                <Download size={18} /> {downloading === 'inventory' ? 'Generating Excel...' : 'Download Inventory Excel (.xlsx)'}
              </button>
            </div>

            {/* Customers Directory Report Card */}
            <div className="table-container" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '14px', color: '#34d399' }}>
                  <Users size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Customer Directory Sheet</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Customer contacts & lifetime sales audit</p>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Includes Customer ID, Customer Name, Mobile Number, Email, Delivery Pincode, Total Orders Placed & Lifetime Spend.
              </p>
              <button
                onClick={() => triggerExport('customers')}
                disabled={downloading === 'customers'}
                className="btn btn-primary"
                style={{ marginTop: 'auto', padding: '0.75rem' }}
              >
                <Download size={18} /> {downloading === 'customers' ? 'Generating Excel...' : 'Download Customers Excel (.xlsx)'}
              </button>
            </div>

            {/* Payment Reconciliation Card */}
            <div className="table-container" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '14px', color: '#fbbf24' }}>
                  <CreditCard size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Payment Reconciliation</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>COD vs Razorpay online payment audit</p>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                Includes Order Number, Customer Name, Mode of Payment (COD/ONLINE), Total Amount, Razorpay Order ID & Transaction Timestamps.
              </p>
              <button
                onClick={() => triggerExport('payments')}
                disabled={downloading === 'payments'}
                className="btn btn-emerald"
                style={{ marginTop: 'auto', padding: '0.75rem' }}
              >
                <Download size={18} /> {downloading === 'payments' ? 'Generating Excel...' : 'Download Payments Excel (.xlsx)'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
