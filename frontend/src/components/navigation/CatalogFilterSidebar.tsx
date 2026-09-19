'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  subcategories: SubcategoryItem[];
}

interface CatalogFilterSidebarProps {
  categories: CategoryItem[];
  departmentSlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
}

export function CatalogFilterSidebar({
  categories,
  departmentSlug = '',
  categorySlug = '',
  subcategorySlug = '',
}: CatalogFilterSidebarProps) {
  const isFiltered = Boolean(categorySlug || subcategorySlug || departmentSlug);

  // On mobile, if a filter is active, start with collapsed dropdown so filtered products are visible!
  const [isOpen, setIsOpen] = useState(!isFiltered);

  // Whenever the active category/subcategory filter changes, automatically collapse the dropdown
  useEffect(() => {
    if (isFiltered) {
      setIsOpen(false);
    }
  }, [categorySlug, subcategorySlug, departmentSlug]);

  // Find active category & subcategory names for summary label
  const activeCat = categories.find((c) => c.slug === categorySlug);
  const activeSub = activeCat?.subcategories.find((s) => s.slug === subcategorySlug);

  let activeLabel = '';
  if (activeSub) {
    activeLabel = `${activeCat?.name || ''} › ${activeSub.name}`;
  } else if (activeCat) {
    activeLabel = activeCat.name;
  }

  return (
    <aside className="card catalog-filter-sidebar" style={{ width: '100%' }}>
      <div className="catalog-filter-accordion">
        {/* Toggle Summary Bar */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.95rem',
            color: 'var(--text-heading)',
            padding: 0,
            textAlign: 'left',
          }}
          aria-expanded={isOpen}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Filter size={18} color="var(--primary-blue)" />
            <span>Filter Catalog & Subcategories</span>
            {activeLabel && (
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  border: '1px solid #bfdbfe',
                }}
              >
                {activeLabel}
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </button>

        {/* Accordion Content */}
        {isOpen && (
          <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.05em' }}>
              Categories & Types
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
              <li>
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  style={{
                    color: !departmentSlug && !categorySlug && !subcategorySlug ? 'var(--primary-blue)' : 'var(--text-body)',
                    fontWeight: !departmentSlug && !categorySlug && !subcategorySlug ? 800 : 600,
                    textDecoration: 'none',
                    display: 'block',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: !departmentSlug && !categorySlug && !subcategorySlug ? '#eff6ff' : 'transparent',
                  }}
                >
                  All Products
                </Link>
              </li>

              {categories.map((cat) => {
                const isCatActive = categorySlug === cat.slug;
                return (
                  <li key={cat.id} style={{ marginBottom: '0.15rem' }}>
                    <Link
                      href={`/products?category=${encodeURIComponent(cat.slug)}`}
                      onClick={() => setIsOpen(false)}
                      style={{
                        color: isCatActive && !subcategorySlug ? 'var(--primary-blue)' : 'var(--text-heading)',
                        fontWeight: isCatActive ? 800 : 700,
                        textDecoration: 'none',
                        display: 'block',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '6px',
                        backgroundColor: isCatActive && !subcategorySlug ? '#eff6ff' : 'transparent',
                        borderLeft: isCatActive ? '3px solid var(--primary-blue)' : '3px solid transparent',
                        fontSize: '0.875rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cat.name}
                    </Link>

                    {cat.subcategories.length > 0 && (
                      <ul
                        style={{
                          listStyle: 'none',
                          paddingLeft: '0.65rem',
                          margin: '0.2rem 0 0.35rem 0.65rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.15rem',
                          borderLeft: '2px solid #e2e8f0',
                        }}
                      >
                        {cat.subcategories.map((sub) => {
                          const isSubActive = subcategorySlug === sub.slug;
                          return (
                            <li key={sub.id}>
                              <Link
                                href={`/products?category=${encodeURIComponent(cat.slug)}&subcategory=${encodeURIComponent(sub.slug)}`}
                                onClick={() => setIsOpen(false)}
                                style={{
                                  color: isSubActive ? 'var(--primary-blue)' : 'var(--text-muted)',
                                  fontWeight: isSubActive ? 800 : 500,
                                  fontSize: '0.8125rem',
                                  textDecoration: 'none',
                                  display: 'block',
                                  padding: '0.2rem 0.4rem',
                                  borderRadius: '4px',
                                  backgroundColor: isSubActive ? '#eff6ff' : 'transparent',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {sub.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
