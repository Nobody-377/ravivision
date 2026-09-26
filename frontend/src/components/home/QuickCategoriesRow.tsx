'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Tv, 
  Snowflake, 
  Wind, 
  Shirt, 
  Fan, 
  Utensils, 
  BatteryCharging, 
  Zap, 
  Flame, 
  LayoutGrid, 
  Sparkles, 
  X 
} from 'lucide-react';

interface QuickCategory {
  name: string;
  image: string;
  fallbackIcon: React.ReactNode;
  slug: string;
  isMore?: boolean;
}

const quickCategories: QuickCategory[] = [
  { 
    name: 'Televisions', 
    image: '/images/categories/televisions.jpg', 
    slug: 'televisions',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="tvBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <linearGradient id="tvScreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="33%" stopColor="#ec4899" />
            <stop offset="66%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#tvBg)" />
        <ellipse cx="32" cy="52" rx="18" ry="3" fill="#334155" opacity="0.3" />
        <path d="M22 51 L42 51 L36 47 L28 47 Z" fill="#334155" />
        <rect x="8" y="14" width="48" height="33" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
        <rect x="10" y="16" width="44" height="29" rx="1.5" fill="url(#tvScreen)" />
        <path d="M10 16 L34 16 L10 38 Z" fill="#ffffff" opacity="0.25" />
      </svg>
    )
  },
  { 
    name: 'Refrigerators', 
    image: '/images/categories/refrigerators.jpg', 
    slug: 'refrigerators',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="fridgeBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="40%" stopColor="#f1f5f9" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#fridgeBg)" />
        <ellipse cx="32" cy="55" rx="14" ry="3" fill="#334155" opacity="0.3" />
        <rect x="20" y="10" width="24" height="43" rx="4" fill="url(#metal)" stroke="#475569" strokeWidth="1" />
        <line x1="20" y1="28" x2="44" y2="28" stroke="#475569" strokeWidth="1" />
        <line x1="32" y1="10" x2="32" y2="28" stroke="#475569" strokeWidth="1" />
        <rect x="30" y="15" width="1.5" height="8" rx="0.75" fill="#334155" />
        <rect x="32.5" y="15" width="1.5" height="8" rx="0.75" fill="#334155" />
        <rect x="31" y="32" width="2" height="12" rx="1" fill="#334155" />
        <rect x="23" y="15" width="5" height="7" rx="1" fill="#1e293b" />
        <rect x="24.5" y="16.5" width="2" height="2" rx="0.5" fill="#0284c7" />
      </svg>
    )
  },
  { 
    name: 'Washing Machines', 
    image: '/images/categories/washing-machines.jpg', 
    slug: 'washing-machines',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="wmBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <linearGradient id="wmBody" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <radialGradient id="glass" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#wmBg)" />
        <ellipse cx="32" cy="54" rx="16" ry="3.5" fill="#334155" opacity="0.3" />
        <rect x="17" y="12" width="30" height="41" rx="4" fill="url(#wmBody)" stroke="#64748b" strokeWidth="1" />
        <rect x="17" y="12" width="30" height="9" fill="#cbd5e1" />
        <line x1="17" y1="21" x2="47" y2="21" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="23" cy="16.5" r="2.5" fill="#475569" />
        <rect x="35" y="15" width="8" height="3" rx="0.5" fill="#0284c7" />
        <circle cx="32" cy="36" r="11" fill="#64748b" />
        <circle cx="32" cy="36" r="9" fill="url(#glass)" />
        <circle cx="32" cy="36" r="6" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.3" />
      </svg>
    )
  },
  { 
    name: 'ACs', 
    image: '/images/categories/acs.jpg', 
    slug: 'acs',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="acBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <linearGradient id="acBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#acBg)" />
        <ellipse cx="32" cy="46" rx="22" ry="4" fill="#334155" opacity="0.25" />
        <rect x="10" y="22" width="44" height="19" rx="3.5" fill="url(#acBody)" stroke="#94a3b8" strokeWidth="1" />
        <line x1="12" y1="36" x2="52" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="42" y="27" width="7" height="3" rx="1" fill="#0284c7" />
        <path d="M18 42 Q20 46 22 49" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" fill="none" />
        <path d="M32 42 Q32 46 32 49" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" fill="none" />
        <path d="M46 42 Q44 46 42 49" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" fill="none" />
      </svg>
    )
  },
  { 
    name: 'Fans', 
    image: '/images/categories/fans.jpg', 
    slug: 'fans',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="fanBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#fanBg)" />
        <line x1="32" y1="8" x2="32" y2="24" stroke="#334155" strokeWidth="2.5" />
        <path d="M32 32 L10 20 Q8 26 12 30 Z" fill="#1e293b" />
        <path d="M32 32 L54 20 Q56 26 52 30 Z" fill="#1e293b" />
        <path d="M32 32 L20 52 Q26 54 30 50 Z" fill="#1e293b" />
        <path d="M32 32 L44 52 Q38 54 34 50 Z" fill="#1e293b" />
        <circle cx="32" cy="32" r="7.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="32" cy="32" r="3.5" fill="#e2e8f0" />
      </svg>
    )
  },
  { 
    name: 'Microwaves', 
    image: '/images/categories/microwaves.jpg', 
    slug: 'microwaves',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="mwBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#mwBg)" />
        <ellipse cx="32" cy="50" rx="20" ry="3.5" fill="#334155" opacity="0.3" />
        <rect x="12" y="18" width="40" height="27" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <rect x="15" y="21" width="24" height="21" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <rect x="17" y="23" width="20" height="17" rx="1" fill="#38bdf8" opacity="0.25" />
        <rect x="41" y="21" width="8" height="21" rx="1" fill="#334155" />
        <rect x="43" y="23" width="4" height="3" rx="0.5" fill="#0284c7" />
        <circle cx="45" cy="30" r="1.5" fill="#94a3b8" />
        <circle cx="45" cy="35" r="1.5" fill="#94a3b8" />
        <rect x="36" y="24" width="1.5" height="15" rx="0.75" fill="#94a3b8" />
      </svg>
    )
  },
  { 
    name: 'Inverters', 
    image: '/images/categories/inverters.jpg', 
    slug: 'inverters',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="invBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#invBg)" />
        <ellipse cx="32" cy="53" rx="21" ry="3.5" fill="#334155" opacity="0.3" />
        <rect x="13" y="24" width="22" height="26" rx="2" fill="#334155" stroke="#475569" strokeWidth="1" />
        <rect x="15" y="20" width="4" height="4" rx="1" fill="#dc2626" />
        <rect x="29" y="20" width="4" height="4" rx="1" fill="#1e293b" />
        <rect x="33" y="16" width="18" height="34" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
        <rect x="36" y="20" width="12" height="6" rx="1" fill="#0284c7" />
        <circle cx="42" cy="34" r="2.5" fill="#22c55e" />
        <path d="M17 20 Q24 12 35 16" stroke="#dc2626" strokeWidth="2" fill="none" />
      </svg>
    )
  },
  { 
    name: 'Kitchen Appliances', 
    image: '/images/categories/kitchen-appliances.jpg', 
    slug: 'kitchen-appliances',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="kaBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#kaBg)" />
        <ellipse cx="32" cy="52" rx="22" ry="3.5" fill="#334155" opacity="0.3" />
        <rect x="12" y="20" width="18" height="28" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <rect x="15" y="32" width="12" height="13" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <rect x="18" y="24" width="6" height="3" rx="1" fill="#38bdf8" />
        <path d="M34 48 L48 48 L48 44 L44 44 L44 26 L52 26 L52 20 L38 20 L38 26 Z" fill="#94a3b8" />
        <ellipse cx="41" cy="42" rx="5" ry="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
      </svg>
    )
  },
  { 
    name: 'Coolers', 
    image: '/images/categories/coolers.jpg', 
    slug: 'coolers',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="clrBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#clrBg)" />
        <ellipse cx="32" cy="55" rx="14" ry="3" fill="#334155" opacity="0.3" />
        <rect x="21" y="12" width="22" height="40" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
        <rect x="24" y="16" width="16" height="18" rx="2" fill="#0284c7" />
        <circle cx="32" cy="25" r="6" fill="#0f172a" />
        <line x1="24" y1="38" x2="40" y2="38" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="24" y1="42" x2="40" y2="42" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="24" y1="46" x2="40" y2="46" stroke="#94a3b8" strokeWidth="1.5" />
        <circle cx="24" cy="53" r="1.5" fill="#334155" />
        <circle cx="40" cy="53" r="1.5" fill="#334155" />
      </svg>
    )
  },
  { 
    name: 'Home Appliances', 
    image: '/images/categories/home-appliances.jpg', 
    slug: 'home-appliances',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="haBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#haBg)" />
        <ellipse cx="32" cy="53" rx="20" ry="3.5" fill="#334155" opacity="0.3" />
        <line x1="22" y1="12" x2="22" y2="45" stroke="#475569" strokeWidth="2.5" />
        <rect x="18" y="10" width="8" height="6" rx="2" fill="#0284c7" />
        <path d="M16 45 L28 45 L30 50 L14 50 Z" fill="#0f172a" />
        <rect x="36" y="26" width="14" height="22" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <ellipse cx="43" cy="26" rx="7" ry="2" fill="#0284c7" />
      </svg>
    )
  },
  { 
    name: 'Geysers', 
    image: '/images/categories/geysers.jpg', 
    slug: 'geysers',
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="gysBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>
        <rect width="64" height="64" fill="url(#gysBg)" />
        <ellipse cx="32" cy="54" rx="12" ry="3" fill="#334155" opacity="0.3" />
        <rect x="22" y="12" width="20" height="36" rx="7" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
        <rect x="28" y="22" width="8" height="10" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <circle cx="32" cy="27" r="2" fill="#dc2626" />
        <rect x="26" y="48" width="3" height="5" rx="0.5" fill="#dc2626" />
        <rect x="35" y="48" width="3" height="5" rx="0.5" fill="#0284c7" />
      </svg>
    )
  },
  { 
    name: 'More Categories', 
    image: '', 
    slug: '', 
    isMore: true,
    fallbackIcon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <rect width="64" height="64" fill="#ffffff" />
        <g transform="translate(17, 17)">
          <rect x="0" y="0" width="13" height="13" rx="3.5" fill="#1e3a8a" />
          <rect x="17" y="0" width="13" height="13" rx="3.5" fill="#1e3a8a" />
          <rect x="17" y="17" width="13" height="13" rx="3.5" fill="#1e3a8a" />
          <rect x="0" y="17" width="13" height="13" rx="3.5" fill="#1e3a8a" />
        </g>
      </svg>
    )
  },
];

export function QuickCategoriesRow() {
  const [showModal, setShowModal] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = (slugName: string) => {
    setImgErrors((prev) => ({ ...prev, [slugName]: true }));
  };

  return (
    <section className="container" style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
      <div
        className="quick-categories-row"
        style={{
          display: 'flex',
          gap: '0.85rem',
          overflowX: 'auto',
          paddingBottom: '0.65rem',
          scrollbarWidth: 'none',
        }}
      >
        {quickCategories.map((cat, idx) => {
          const catSlugKey = cat.slug || 'more';
          const hasError = imgErrors[catSlugKey];

          if (cat.isMore) {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setShowModal(true)}
                className="quick-category-item"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  minWidth: '68px',
                  flexShrink: 0,
                }}
              >
                <div
                  className="quick-category-icon-card"
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1.5px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.07), 0 1px 3px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.18s ease-in-out',
                    overflow: 'hidden',
                    padding: '3px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ffffff',
                    }}
                  >
                    {cat.fallbackIcon}
                  </div>
                </div>
                <span
                  className="quick-category-label"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    textAlign: 'center',
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                    maxWidth: '82px',
                    marginTop: '0.15rem',
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          }

          const catHref = '/products?category=' + encodeURIComponent(cat.slug);

          return (
            <Link
              key={idx}
              href={catHref}
              className="quick-category-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
                minWidth: '68px',
                flexShrink: 0,
              }}
            >
              <div
                className="quick-category-icon-card"
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '20px',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1.5px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.07), 0 1px 3px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.18s ease-in-out',
                  overflow: 'hidden',
                  padding: '3px',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle at 50% 45%, #ffffff 0%, #e2e8f0 60%, #94a3b8 100%)',
                  }}
                >
                  {cat.image && !hasError ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      onError={() => handleImgError(catSlugKey)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    cat.fallbackIcon
                  )}
                </div>
              </div>
              <span
                className="quick-category-label"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  textAlign: 'center',
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                  maxWidth: '82px',
                  marginTop: '0.15rem',
                }}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                right: '14px',
                top: '14px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={18} />
            </button>

            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Sparkles size={32} />
            </div>

            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '0.5rem',
              }}
            >
              More Categories Incoming...
            </h3>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#475569',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
              }}
            >
              We are constantly expanding our store catalog! More exciting electronics, electrical supplies, and home appliance categories are on their way. Stay tuned!
            </p>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.9375rem',
                padding: '0.75rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
