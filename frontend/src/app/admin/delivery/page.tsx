'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '@/lib/currency';
import { MapPin, Plus, Check, Edit2, Save, X, AlertCircle } from 'lucide-react';

interface ZoneData {
  id: string;
  pincode: string;
  area: string;
  city: string;
  active: boolean;
  oneDayDelivery: boolean;
  deliveryCharge: number;
  notes?: string;
}

export default function AdminDeliveryPage() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [oneDayDelivery, setOneDayDelivery] = useState(false);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delivery');
      const data = await res.json();
      if (data.success) {
        setZones(data.data || []);
      }
    } catch {
      console.error('Error fetching zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || !area || !city) return;

    setSubmitting(true);
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
          active,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPincode('');
        setArea('');
        setCity('');
        setDeliveryCharge('0');
        setOneDayDelivery(false);
        fetchZones();
      } else {
        alert(data.error?.message || 'Failed to save zone.');
      }
    } catch {
      alert('Error saving zone.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)' }}>
          Serviceable Delivery Zones
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Configure real serviceable pincodes, area delivery charges, and ~1-day local delivery flags
        </p>
      </div>

      {/* Add / Edit Pincode Form */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          Add or Update Serviceable Pincode
        </h3>

        <form onSubmit={handleSaveZone} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
              Pincode *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. 821107"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
              Area Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kargahar (Local)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
              City *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rohtas, Bihar"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
              Delivery Fee (₹)
            </label>
            <input
              type="number"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', justifyContent: 'center' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={oneDayDelivery}
                onChange={(e) => setOneDayDelivery(e.target.checked)}
              />
              One-Day Delivery Eligible
            </label>

            <label style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Pincode Active
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
          >
            <Plus size={16} /> Save Pincode
          </button>
        </form>
      </div>

      {/* Pincodes Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '1rem' }}>
          Configured Serviceable Pincodes ({zones.length})
        </h3>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading delivery zones...</div>
        ) : zones.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Pincode</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Area</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>City</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Delivery Fee</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>One-Day Delivery</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{z.pincode}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{z.area}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{z.city}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                      {z.deliveryCharge === 0 ? 'FREE' : formatINR(z.deliveryCharge)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${z.oneDayDelivery ? 'badge-success' : 'badge-info'}`}>
                        {z.oneDayDelivery ? '⚡ Yes (~1-Day)' : 'Standard Local'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${z.active ? 'badge-success' : 'badge-danger'}`}>
                        {z.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
            No pincodes configured yet. Add your store's serviceable pincodes using the form above.
          </div>
        )}
      </div>

    </div>
  );
}
