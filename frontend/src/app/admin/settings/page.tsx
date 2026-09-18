'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { 
  ShieldCheck, 
  Plus, 
  X, 
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Zap
} from 'lucide-react';

export default function AdminOperationsPage() {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<any[]>([]);
  
  // Admin Credentials State (Username & Password)
  const [adminUsername, setAdminUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [adminName, setAdminName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  const [clearSessionsLoading, setClearSessionsLoading] = useState(false);

  const handleClearAllSessions = async () => {
    if (!confirm('Are you sure you want to delete and revoke all active admin logins? All logged-in admin sessions will be terminated immediately.')) {
      return;
    }
    setClearSessionsLoading(true);
    try {
      const res = await fetch('/api/admin/auth/clear-all-sessions', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'All admin logins cleared successfully.');
        window.location.href = '/admin/login';
      } else {
        alert(data.error?.message || 'Failed to clear admin sessions.');
      }
    } catch (err) {
      alert('Network error while clearing admin sessions.');
    } finally {
      setClearSessionsLoading(false);
    }
  };

  // Store Profile & Operating Hours State
  const [storeNameSetting, setStoreNameSetting] = useState('Ravi Electronics');
  const [storePhoneSetting, setStorePhoneSetting] = useState('9631410611');
  const [addressSetting, setAddressSetting] = useState('4WHG+7H Kargahar');
  const [citySetting, setCitySetting] = useState('Kargahar');
  const [stateSetting, setStateSetting] = useState('Bihar');
  const [pincodeSetting, setPincodeSetting] = useState('821107');
  const [openingHoursSetting, setOpeningHoursSetting] = useState('24/7 Open');
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSuccess, setStoreSuccess] = useState('');
  const [storeError, setStoreError] = useState('');

  // New Delivery Zone Modal State
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [oneDayDelivery, setOneDayDelivery] = useState(false);
  const [zoneSaving, setZoneSaving] = useState(false);

  const fetchAdminProfile = async () => {
    try {
      const res = await fetch('/api/admin/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setAdminUsername(data.data.username || '');
          setNewUsername(data.data.username || '');
          setAdminName(data.data.name || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin profile:', err);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setStoreNameSetting(data.data.storeName || 'Ravi Electronics');
          setStorePhoneSetting(data.data.phone || '9631410611');
          setAddressSetting(data.data.address || '4WHG+7H Kargahar');
          setCitySetting(data.data.city || 'Kargahar');
          setStateSetting(data.data.state || 'Bihar');
          setPincodeSetting(data.data.pincode || '821107');
          setOpeningHoursSetting(data.data.openingHours || '24/7 Open');
        }
      }
    } catch (err) {
      console.error('Failed to fetch store settings:', err);
    }
  };

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
    fetchAdminProfile();
    fetchStoreSettings();
    fetchZones();
  }, []);

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreSaving(true);
    setStoreSuccess('');
    setStoreError('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeNameSetting,
          phone: storePhoneSetting,
          address: addressSetting,
          city: citySetting,
          state: stateSetting,
          pincode: pincodeSetting,
          openingHours: openingHoursSetting,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStoreSuccess('Store Profile & Operating Settings updated successfully!');
      } else {
        setStoreError(data.error?.message || 'Failed to update store settings.');
      }
    } catch {
      setStoreError('Network error updating store settings.');
    } finally {
      setStoreSaving(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdSuccess('');
    setPwdError('');

    if (newPassword && newPassword !== confirmNewPassword) {
      setPwdError('New passwords do not match.');
      setPwdLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newUsername: newUsername !== adminUsername ? newUsername : undefined,
          newPassword: newPassword || undefined,
          name: adminName || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPwdSuccess('Admin username and/or password updated successfully!');
        if (data.data?.username) {
          setAdminUsername(data.data.username);
          setNewUsername(data.data.username);
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPwdError(data.error?.message || 'Failed to update credentials.');
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
            
            {/* Store Profile & Operating Hours Card */}
            <div className="table-container" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.6rem', background: '#ecfdf5', borderRadius: '12px', color: '#059669' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Store Profile & Operating Settings</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Manage store name, address, contact phone & operating hours</p>
                </div>
              </div>

              {storeSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#047857', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={16} /> <span>{storeSuccess}</span>
                </div>
              )}

              {storeError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff1f2', color: '#be123c', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} /> <span>{storeError}</span>
                </div>
              )}

              <form onSubmit={handleSaveStoreSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Shop Name
                    </label>
                    <input
                      type="text"
                      required
                      value={storeNameSetting}
                      onChange={(e) => setStoreNameSetting(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Store Support Phone
                    </label>
                    <input
                      type="text"
                      required
                      value={storePhoneSetting}
                      onChange={(e) => setStorePhoneSetting(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                    Store Address / Location Code
                  </label>
                  <input
                    type="text"
                    required
                    value={addressSetting}
                    onChange={(e) => setAddressSetting(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#0f172a',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      City / Tehsil
                    </label>
                    <input
                      type="text"
                      required
                      value={citySetting}
                      onChange={(e) => setCitySetting(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={stateSetting}
                      onChange={(e) => setStateSetting(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      value={pincodeSetting}
                      onChange={(e) => setPincodeSetting(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    required
                    value={openingHoursSetting}
                    onChange={(e) => setOpeningHoursSetting(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#0f172a',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={storeSaving}
                  className="btn btn-emerald"
                  style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                >
                  {storeSaving ? 'Saving Settings...' : 'Save Store Settings'}
                </button>
              </form>
            </div>

            {/* Admin Credentials & Authentication Security Card */}
            <div className="table-container" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.6rem', background: '#eff6ff', borderRadius: '12px', color: '#2563eb' }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Admin Credentials & Profile</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Update login username, display name & BCrypt password hash</p>
                </div>
              </div>

              {pwdSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#047857', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <CheckCircle2 size={16} /> <span>{pwdSuccess}</span>
                </div>
              )}

              {pwdError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff1f2', color: '#be123c', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} /> <span>{pwdError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                    Current Admin Password <span style={{ color: '#be123c' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to verify identity"
                    style={{
                      width: '100%',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#0f172a',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Admin Username
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. admin@ravivision.com"
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Store Administrator"
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      style={{
                        width: '100%',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '0.65rem 0.85rem',
                        color: '#0f172a',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={pwdLoading} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  {pwdLoading ? 'Saving Changes...' : 'Save Admin Credentials & Password'}
                </button>
              </form>
            </div>

            {/* Admin Session Security Card */}
            <div className="table-container" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.6rem', background: '#ecfdf5', borderRadius: '12px', color: '#047857' }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Session Security (`AdminSession`)</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Hashed session tokens & expiration state</p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Cookie Token Encryption:</span>
                  <span className="badge badge-emerald">SHA-256 Hashed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Session Expiration Window:</span>
                  <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.85rem' }}>7 Days Sliding Window</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Cookie Policy:</span>
                  <span style={{ fontWeight: 600, color: '#7c3aed', fontSize: '0.85rem' }}>HttpOnly, SameSite=Lax</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.85rem 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} color="#2563eb" /> All admin session tokens are stored in the database as SHA-256 hashes to prevent raw token compromise.
                </div>

                <button
                  type="button"
                  onClick={handleClearAllSessions}
                  disabled={clearSessionsLoading}
                  className="btn"
                  style={{
                    width: '100%',
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#e11d48',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Trash2 size={16} />
                  {clearSessionsLoading ? 'Revoking All Admin Logins...' : 'Revoke & Delete All Admin Logins'}
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Charge Controls (`DeliveryZone`) */}
          <div className="table-container">
            <div className="table-header-toolbar">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Delivery Charge Controls (`DeliveryZone` Engine)
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Manage pincode-wise delivery charges and toggle 1-day express delivery availability
                </p>
              </div>

              <button onClick={() => setShowAddZoneModal(true)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <Plus size={16} /> Add New Pincode Zone
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading delivery zones...</div>
            ) : zones.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No delivery zones configured yet.</div>
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
                      <td style={{ fontWeight: 800, color: '#2563eb', fontFamily: 'monospace', fontSize: '1rem' }}>
                        {zone.pincode}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{zone.area}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{zone.city}</div>
                      </td>
                      <td style={{ fontWeight: 800, color: '#059669' }}>
                        ₹{Number(zone.deliveryCharge).toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleOneDay(zone.id, zone.oneDayDelivery)}
                          className={`badge ${zone.oneDayDelivery ? 'badge-emerald' : 'badge-amber'}`}
                          style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          {zone.oneDayDelivery ? <><Zap size={11} fill="#10b981" /> 1-Day Express Available</> : 'Standard Only'}
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
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#be123c', borderColor: '#fca5a5' }}
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
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Add New Delivery Zone
              </h2>
              <button onClick={() => setShowAddZoneModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddZone} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
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
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
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
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
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
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      color: '#0f172a',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
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
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    color: '#0f172a',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <input
                  type="checkbox"
                  id="oneDayCheck"
                  checked={oneDayDelivery}
                  onChange={(e) => setOneDayDelivery(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="oneDayCheck" style={{ fontSize: '0.85rem', color: '#0f172a', cursor: 'pointer', fontWeight: 600 }}>
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
