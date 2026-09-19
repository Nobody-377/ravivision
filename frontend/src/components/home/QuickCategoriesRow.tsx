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
  { name: 'Televisions', image: '/images/categories/televisions.jpg', fallbackIcon: <Tv size={24} color="#4f46e5" />, slug: 'televisions' },
  { name: 'Refrigerators', image: '/images/categories/refrigerators.jpg', fallbackIcon: <Snowflake size={24} color="#0284c7" />, slug: 'refrigerators' },
  { name: 'Washing Machines', image: '/images/categories/washing-machines.jpg', fallbackIcon: <Shirt size={24} color="#4f46e5" />, slug: 'washing-machines' },
  { name: 'ACs', image: '/images/categories/acs.jpg', fallbackIcon: <Wind size={24} color="#0d9488" />, slug: 'acs' },
  { name: 'Fans', image: '/images/categories/fans.jpg', fallbackIcon: <Fan size={24} color="#0284c7" />, slug: 'fans' },
  { name: 'Microwaves', image: '/images/categories/microwaves.jpg', fallbackIcon: <Utensils size={24} color="#ea580c" />, slug: 'microwaves' },
  { name: 'Inverters', image: '/images/categories/inverters.jpg', fallbackIcon: <BatteryCharging size={24} color="#d97706" />, slug: 'inverters' },
  { name: 'Kitchen Appliances', image: '/images/categories/kitchen-appliances.jpg', fallbackIcon: <Utensils size={24} color="#16a34a" />, slug: 'kitchen-appliances' },
  { name: 'Coolers', image: '/images/categories/coolers.jpg', fallbackIcon: <Fan size={24} color="#2563eb" />, slug: 'coolers' },
  { name: 'Home Appliances', image: '/images/categories/home-appliances.jpg', fallbackIcon: <Zap size={24} color="#0284c7" />, slug: 'home-appliances' },
  { name: 'Geysers', image: '/images/categories/geysers.jpg', fallbackIcon: <Flame size={24} color="#dc2626" />, slug: 'geysers' },
  { name: 'Wiring Materials', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&q=80', fallbackIcon: <Zap size={24} color="#ca8a04" />, slug: 'wiring-materials' },
  { name: 'More Categories', image: '', fallbackIcon: <LayoutGrid size={24} color="#475569" />, slug: '', isMore: true },
];

export function QuickCategoriesRow() {
  const [showModal, setShowModal] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = (slugName: string) => {
    setImgErrors((prev) => ({ ...prev, [slugName]: true }));
  };

  return (
    <section className="container">
      <div
        className="quick-categories-row"
        style={{
          display: 'flex',
          gap: '0.85rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
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
                  gap: '0.45rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  minWidth: '68px',
                }}
              >
                <div
                  className="quick-category-icon-card"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                    transition: 'transform 0.15s ease, boxShadow 0.15s ease',
                    overflow: 'hidden',
                  }}
                >
                  {cat.fallbackIcon}
                </div>
                <span
                  className="quick-category-label"
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    textAlign: 'center',
                    lineHeight: 1.25,
                    maxWidth: '72px',
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
                gap: '0.45rem',
                textDecoration: 'none',
                minWidth: '68px',
              }}
            >
              <div
                className="quick-category-icon-card"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.15s ease, boxShadow 0.15s ease',
                  overflow: 'hidden',
                  padding: '3px',
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
                      borderRadius: '13px',
                    }}
                  />
                ) : (
                  cat.fallbackIcon
                )}
              </div>
              <span
                className="quick-category-label"
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  textAlign: 'center',
                  lineHeight: 1.25,
                  maxWidth: '72px',
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
