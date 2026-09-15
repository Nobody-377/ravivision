'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Plus, 
  Check, 
  X, 
  Clock, 
  Truck, 
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function AdminOperationsPage() {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<any[]>([]);
  
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // New Delivery Zone Modal State
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [oneDayDelivery, setOneDayDelivery] = useState(false);
  const [zoneSaving, setZoneSaving] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delivery');
      if (res.ok) {
        const data = await res.json();
        setZones(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdSuccess('');
    setPwdError('');

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPwdSuccess('Admin password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPwdError(data.error?.message || 'Failed to update password');
      }
    } catch (err) {
      setPwdError('Server connection error.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setZoneSaving(true);
    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pincode,
          area,
          city,
          deliveryCharge: Number(deliveryCharge),
          oneDayDelivery,
          active: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setZones(prev => [...prev, data.data]);
        setShowAddZoneModal(false);
        setPincode('');
        setArea('');
        setCity('');
        setDeliveryCharge('0');
        setOneDayDelivery(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setZoneSaving(false);
    }
  };

  const handleToggleZoneActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/delivery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        setZones(prev => prev.map(z => z.id === id ? { ...z, active: !currentActive } : z));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleOneDay = async (id: string, currentOneDay: boolean) => {
    try {
      const res = await fetch(`/api/admin/delivery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oneDayDelivery: !currentOneDay }),
      });
      if (res.ok) {
        setZones(prev => prev.map(z => z.id === id ? { ...z, oneDayDelivery: !currentOneDay } : z));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery zone?')) return;
    try {
      const res = await fetch(`/api/admin/delivery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setZones(prev => prev.filter(z => z.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <AdminHeader 
          title="Admin Operations & Security Settings" 
          subtitle="Authentication, session token security, password changes & pincode delivery charge controls"
          onRefresh={fetchZones}
          isRefreshing={loading}
        />

        <main className="admin-content animate-fade-in">
          {/* Top Security Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Admin Authentication & Change Password Card */}
            <div className="table-container" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Admin Authentication (`AdminUser`)</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>BCrypt password hash security controls</p>
                </div>
              </div>

              {pwdSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={16} /> <span>{pwdSuccess}</span>
                </div>
              )}

              {pwdError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(244, 63, 94, 0.15)', color: '#f87171', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} /> <span>{pwdError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Current Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <button type="submit" disabled={pwdLoading} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  {pwdLoading ? 'Updating Password...' : 'Update Admin Password'}
                </button>
              </form>
            </div>

            {/* Admin Session Security Card */}
            <div className="table-container" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#34d399' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Session Security (`AdminSession`)</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Hashed session tokens & expiration state</p>
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cookie Token Encryption:</span>
                  <span className="badge badge-emerald">SHA-256 Hashed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Session Expiration Window:</span>
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.85rem' }}>7 Days Sliding Window</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cookie Policy:</span>
                  <span style={{ fontWeight: 600, color: '#c084fc', fontSize: '0.85rem' }}>HttpOnly, SameSite=Lax</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', padding: '0.85rem 1rem', background: 'rgba(51, 65, 85, 0.4)', borderRadius: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                🛡️ All admin session tokens are stored in the database as SHA-256 hashes to prevent raw token compromise.
              </div>
            </div>
          </div>

          {/* Delivery Charge Controls (`DeliveryZone`) */}
          <div className="table-container">
            <div className="table-header-toolbar">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Delivery Charge Controls (`DeliveryZone` Engine)
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Manage pincode-wise delivery charges and toggle 1-day express delivery availability
                </p>
              </div>

              <button onClick={() => setShowAddZoneModal(true)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <Plus size={16} /> Add New Pincode Zone
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading delivery zones...</div>
            ) : zones.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No delivery zones configured yet.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Pincode</th>
                    <th>Area & City</th>
                    <th>Delivery Charge (₹)</th>
                    <th>1-Day Express Delivery</th>
                    <th>Zone Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id}>
                      <td style={{ fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', fontSize: '1rem' }}>
                        {zone.pincode}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{zone.area}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{zone.city}</div>
                      </td>
                      <td style={{ fontWeight: 800, color: '#34d399' }}>
                        ₹{Number(zone.deliveryCharge).toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleOneDay(zone.id, zone.oneDayDelivery)}
                          className={`badge ${zone.oneDayDelivery ? 'badge-emerald' : 'badge-amber'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                        >
                          {zone.oneDayDelivery ? '⚡ 1-Day Express Available' : 'Standard Only'}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleZoneActive(zone.id, zone.active)}
                          className={`badge ${zone.active ? 'badge-emerald' : 'badge-rose'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                        >
                          {zone.active ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#f87171' }}
                        >
                          <Trash2 size={14} /> Remove
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

      {/* Add Pincode Zone Modal */}
      {showAddZoneModal && (
        <div className="modal-overlay" onClick={() => setShowAddZoneModal(false)}>
          <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                Add New Delivery Zone
              </h2>
              <button onClick={() => setShowAddZoneModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddZone} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Pincode (6 Digits)
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 395007"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    Area / Locality Name
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Vesu"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Surat"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                  Delivery Charge (INR ₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <input
                  type="checkbox"
                  id="oneDayCheck"
                  checked={oneDayDelivery}
                  onChange={(e) => setOneDayDelivery(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="oneDayCheck" style={{ fontSize: '0.85rem', color: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}>
                  Enable 1-Day Express Delivery Availability
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={zoneSaving}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {zoneSaving ? 'Adding...' : 'Add Delivery Zone'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddZoneModal(false)}
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
