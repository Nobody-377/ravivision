'use client';

import React, { useState } from 'react';
import { MapPin, X, CheckCircle2, AlertCircle, PhoneCall, Zap, Check, ArrowRight } from 'lucide-react';

export interface LocationData {
  pincode: string;
  area: string;
  city: string;
  isServiceable: boolean;
  oneDayDelivery?: boolean;
}

interface PincodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPincode?: string;
  onSelectLocation: (location: LocationData) => void;
  onCallToOrder?: () => void;
}

// Preset local delivery zones for quick selection
const PRESET_ZONES: Array<{ pincode: string; area: string }> = [
  { pincode: '821107', area: 'Kargahar' },
  { pincode: '821112', area: 'Kochas' },
  { pincode: '821115', area: 'Sasaram' },
  { pincode: '821104', area: 'Chenari' },
  { pincode: '802215', area: 'Garh Nokha' },
  { pincode: '821113', area: 'Sheosagar' },
  { pincode: '821108', area: 'Kudra' },
  { pincode: '802212', area: 'Bikramganj' },
  { pincode: '821307', area: 'Dehri-on-Sone' },
  { pincode: '821109', area: 'Mohania' },
];

export function PincodeModal({
  isOpen,
  onClose,
  currentPincode = '821107',
  onSelectLocation,
  onCallToOrder,
}: PincodeModalProps) {
  const [pincodeInput, setPincodeInput] = useState(currentPincode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<{
    pincode: string;
    isServiceable: boolean;
    oneDayDelivery: boolean;
    deliveryCharge: number;
    area?: string;
    city?: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerifyPincode = async (targetPincode: string) => {
    const trimmed = targetPincode.trim();
    if (!trimmed || trimmed.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit Indian pincode.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setCheckResult(null);

    try {
      const res = await fetch(`/api/pincode/check?pincode=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.success && data.data) {
        setCheckResult(data.data);
        if (data.data.isServiceable) {
          const loc: LocationData = {
            pincode: data.data.pincode,
            area: data.data.area || 'Local Area',
            city: data.data.city || 'Rohtas, Bihar',
            isServiceable: true,
            oneDayDelivery: data.data.oneDayDelivery,
          };
          onSelectLocation(loc);
        }
      } else {
        setCheckResult({
          pincode: trimmed,
          isServiceable: false,
          oneDayDelivery: false,
          deliveryCharge: 0,
          message: data.error?.message || 'Online delivery is currently unavailable for this pincode.',
        });
      }
    } catch {
      setErrorMsg('Failed to connect to pincode verification service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyPincode(pincodeInput);
  };

  const handleSelectPreset = (pincode: string) => {
    setPincodeInput(pincode);
    handleVerifyPincode(pincode);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '1.5rem',
          position: 'relative',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          backgroundColor: '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.1rem',
            right: '1.1rem',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MapPin size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              Select Delivery Location
            </h3>
            <p style={{ fontSize: '0.775rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>
              Enter your 6-digit pincode to check local store delivery availability
            </p>
          </div>
        </div>

        {/* Pincode Input Form */}
        <form onSubmit={handleFormSubmit} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit Pincode"
              value={pincodeInput}
              onChange={(e) => {
                setPincodeInput(e.target.value.replace(/\D/g, ''));
                setErrorMsg(null);
              }}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontWeight: 600,
                outline: 'none',
                color: '#0f172a',
                backgroundColor: '#f8fafc',
              }}
            />
            <button
              type="submit"
              disabled={loading || pincodeInput.length !== 6}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.15rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                borderRadius: '10px',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Checking...' : 'Apply'}
            </button>
          </div>

          {errorMsg && (
            <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.35rem', fontWeight: 600 }}>
              {errorMsg}
            </p>
          )}
        </form>

        {/* Verification Result Card */}
        {checkResult && (
          <div style={{ marginBottom: '1.15rem' }}>
            {checkResult.isServiceable ? (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  color: '#15803d',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.875rem' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span>
                    {checkResult.oneDayDelivery ? '⚡ 1-Day Local Delivery Available!' : '✓ Local Delivery Available'}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#166534', margin: '0.25rem 0 0 0' }}>
                  Serving <strong>{checkResult.area || 'Local Region'}</strong> ({checkResult.pincode}) —{' '}
                  {checkResult.deliveryCharge === 0 ? 'Free Delivery' : `Delivery Fee ₹${checkResult.deliveryCharge}`}
                </p>
                <button
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    marginTop: '0.65rem',
                    padding: '0.5rem',
                    fontSize: '0.8125rem',
                    backgroundColor: '#16a34a',
                    borderRadius: '8px',
                  }}
                >
                  Set Location & Continue
                </button>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  color: '#92400e',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <AlertCircle size={18} color="#ea580c" />
                  <span>Online Delivery Unavailable for {checkResult.pincode}</span>
                </div>
                <p style={{ fontSize: '0.775rem', color: '#b45309', margin: 0, lineHeight: 1.35 }}>
                  {checkResult.message || 'We deliver locally within Kargahar & surrounding Rohtas/Kaimur region.'}
                </p>
                {onCallToOrder && (
                  <button
                    onClick={() => {
                      onClose();
                      onCallToOrder();
                    }}
                    className="btn btn-phone"
                    style={{
                      width: '100%',
                      marginTop: '0.65rem',
                      padding: '0.45rem',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                    }}
                  >
                    <PhoneCall size={14} /> Call Ravi Vision Store to Order
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Select Presets */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            Popular Delivery Zones (Rohtas & Kaimur)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {PRESET_ZONES.map((zone) => {
              const isSelected = pincodeInput === zone.pincode;
              return (
                <button
                  key={zone.pincode}
                  onClick={() => handleSelectPreset(zone.pincode)}
                  style={{
                    backgroundColor: isSelected ? '#2563eb' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#1e293b',
                    border: '1px solid',
                    borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {zone.area} ({zone.pincode})
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
