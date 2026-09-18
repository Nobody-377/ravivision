'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { exportToExcel } from '@/lib/excel-export';
import { Search, Phone, Mail, MapPin, FileSpreadsheet, User, Navigation } from 'lucide-react';

export default function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.customerId?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.state?.toLowerCase().includes(q) ||
      c.pincode?.includes(q)
    );
  });

  const handleExportExcel = () => {
    const reportData = filteredCustomers.map(c => ({
      'Customer ID (UUID)': c.customerId,
      'Customer Name': c.name,
      'Mobile Number': c.mobile,
      'Email Address': c.email,
      'Street Address': c.address,
      'Landmark': c.landmark,
      'City': c.city,
      'State': c.state,
      'Pincode': c.pincode,
      'Total Orders Placed': c.ordersCount,
      'Total Lifetime Spend (₹)': c.totalSpent,
      'Last Order Timestamp': new Date(c.lastOrderDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }));
    exportToExcel('Customer_Directory_Export', 'Customers', reportData);
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader 
          title="Customer Directory & Geography" 
          subtitle="Customer IDs (UUID), contacts, street addresses, landmarks, city, state & pincodes"
          onRefresh={fetchCustomerData}
          isRefreshing={loading}
        />

        <main className="admin-content animate-fade-in">
          <div className="table-container">
            <div className="table-header-toolbar">
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none', zIndex: 10 }} />
                <input
                  type="text"
                  placeholder="Search customer ID, name, mobile, city, state..."
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
                <FileSpreadsheet size={16} /> Export Customers to Excel
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading customer records...</div>
            ) : filteredCustomers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No customer records found.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Customer Name</th>
                    <th>Mobile & Email</th>
                    <th>Address & Landmark</th>
                    <th>City, State & Pincode</th>
                    <th>Orders</th>
                    <th>Lifetime Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {c.customerId}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={14} color="#2563eb" /> {c.name}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={12} /> {c.mobile}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Mail size={12} /> {c.email}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#0f172a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.address}
                        </div>
                        {c.landmark && c.landmark !== 'N/A' && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Near: {c.landmark}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Navigation size={12} color="#7c3aed" /> {c.city}, {c.state}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>Pincode: {c.pincode}</div>
                      </td>
                      <td style={{ fontWeight: 700, textAlign: 'center' }}>{c.ordersCount}</td>
                      <td style={{ fontWeight: 800, color: '#059669' }}>₹{c.totalSpent.toLocaleString('en-IN')}</td>
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
