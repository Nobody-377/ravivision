import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/currency';
import { Search, Filter, CheckCircle, Store, ArrowRight, ChevronDown } from 'lucide-react';

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    department?: string;
    category?: string;
    subcategory?: string;
    brand?: string;
  }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || '';
  const departmentSlug = params.department?.trim() || '';
  const categorySlug = params.category?.trim() || '';
  const subcategorySlug = params.subcategory?.trim() || '';
  const brandFilter = params.brand?.trim() || '';

  // Build Prisma filter query for ACTIVE sellable products
  const whereClause: any = {
    status: { in: ['ACTIVE', 'OUT_OF_STOCK'] }, // Allow viewing active & out of stock
  };

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { sku: { contains: search } },
      { description: { contains: search } },
      {
        productDefinition: {
          OR: [
            { productType: { contains: search } },
            { websiteMenuLabel: { contains: search } },
            { exampleBrands: { contains: search } },
            { keyAttributes: { contains: search } },
            {
              subcategory: {
                OR: [
                  { name: { contains: search } },
                  { category: { name: { contains: search } } },
                  { category: { department: { name: { contains: search } } } },
                ],
              },
            },
          ],
        },
      },
    ];
  }

  if (brandFilter) {
    whereClause.brand = brandFilter;
  }

  if (subcategorySlug) {
    whereClause.productDefinition = {
      subcategory: {
        slug: subcategorySlug,
      },
    };
  } else if (categorySlug) {
    whereClause.productDefinition = {
      subcategory: {
        category: {
          slug: categorySlug,
        },
      },
    };
  } else if (departmentSlug) {
    whereClause.productDefinition = {
      subcategory: {
        category: {
          department: {
            slug: departmentSlug,
          },
        },
      },
    };
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      productDefinition: {
        include: {
          subcategory: {
            include: {
              category: {
                include: {
                  department: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch all primary categories with their subcategories for sidebar filtering
  const categories = await prisma.category.findMany({
    include: {
      subcategories: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Also query catalog definitions if searching
  const catalogDefinitions = search
    ? await prisma.productDefinition.findMany({
        where: {
          OR: [
            { productType: { contains: search } },
            { websiteMenuLabel: { contains: search } },
            { exampleBrands: { contains: search } },
          ],
        },
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
        take: 12,
      })
    : [];

  return (
    <div className="container products-page-container">
      
      {/* Page Title & Search Header */}
      <div className="products-page-header">
        <h1 className="products-page-title">
          {search ? `Search Results for "${search}"` : 'Store Product Catalog'}
        </h1>
      </div>

      {/* Horizontal Category Quick Filter Pills for Mobile & Desktop */}
      <div
        className="category-quick-pills"
        style={{
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          paddingBottom: '0.6rem',
          marginBottom: '1rem',
          scrollbarWidth: 'none',
        }}
      >
        <Link
          href="/products"
          style={{
            whiteSpace: 'nowrap',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            fontWeight: !categorySlug ? 800 : 600,
            backgroundColor: !categorySlug ? 'var(--primary-blue)' : '#f1f5f9',
            color: !categorySlug ? '#ffffff' : '#334155',
            textDecoration: 'none',
            flexShrink: 0,
            border: !categorySlug ? 'none' : '1px solid #e2e8f0',
          }}
        >
          All Products
        </Link>
        {categories.map((cat) => {
          const isActive = categorySlug === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.slug)}`}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 800 : 600,
                backgroundColor: isActive ? 'var(--primary-blue)' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#334155',
                textDecoration: 'none',
                flexShrink: 0,
                border: isActive ? 'none' : '1px solid #e2e8f0',
              }}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      <div className="catalog-layout-grid">
        
        {/* Left Sidebar Filter Panel */}
        <aside className="card catalog-filter-sidebar">
          <details className="catalog-filter-accordion">
            <summary style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-heading)', userSelect: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} color="var(--primary-blue)" /> Filter Catalog & Subcategories
              </div>
              <ChevronDown size={18} color="#64748b" />
            </summary>

            <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.05em' }}>
                Categories & Types
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <li>
                  <Link
                    href="/products"
                    style={{
                      color: !departmentSlug && !categorySlug && !subcategorySlug ? 'var(--primary-blue)' : 'var(--text-body)',
                      fontWeight: !departmentSlug && !categorySlug && !subcategorySlug ? 700 : 500,
                      textDecoration: 'none',
                      display: 'block',
                      padding: '0.2rem 0',
                    }}
                  >
                    All Products
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${encodeURIComponent(cat.slug)}`}
                      style={{
                        color: categorySlug === cat.slug && !subcategorySlug ? 'var(--primary-blue)' : 'var(--text-heading)',
                        fontWeight: categorySlug === cat.slug ? 800 : 700,
                        textDecoration: 'none',
                        display: 'block',
                        padding: '0.15rem 0',
                        fontSize: '0.875rem',
                      }}
                    >
                      {cat.name}
                    </Link>

                    {cat.subcategories.length > 0 && (
                      <ul style={{ listStyle: 'none', paddingLeft: '0.75rem', margin: '0.2rem 0 0.4rem 0', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {cat.subcategories.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={`/products?category=${encodeURIComponent(cat.slug)}&subcategory=${encodeURIComponent(sub.slug)}`}
                              style={{
                                color: subcategorySlug === sub.slug ? 'var(--primary-blue)' : 'var(--text-muted)',
                                fontWeight: subcategorySlug === sub.slug ? 700 : 400,
                                fontSize: '0.8125rem',
                                textDecoration: 'none',
                                display: 'block',
                              }}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </aside>

        {/* Right Main Products Grid */}
        <div>
          {products.length > 0 ? (
            <div className="catalog-products-grid">
              {products.map((prod) => {
                const primaryImg = prod.images && prod.images[0]?.url ? prod.images[0].url : 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80';
                const price = Number(prod.price || 0);
                const mrp = Number(prod.mrp || 0);

                return (
                  <div key={prod.id} className="card catalog-product-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '0.75rem 0.65rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div>
                      {/* Top Row: Brand & Stock Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0d52bf', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '62%' }}>
                          {prod.brand}
                        </span>
                        <span style={{ backgroundColor: prod.stock > 0 ? '#e8f5e9' : '#fef3c7', color: prod.stock > 0 ? '#16a34a' : '#d97706', fontSize: '0.6rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '9999px', textTransform: 'uppercase', flexShrink: 0 }}>
                          {prod.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </div>

                      {/* Product Image Thumbnail */}
                      <Link href={`/products/${prod.slug}`} className="catalog-card-img" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px', padding: '0.25rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
                        <img
                          src={primaryImg}
                          alt={prod.name}
                          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </Link>

                      {/* Product Title */}
                      <h3 className="catalog-card-title" style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0.25rem 0', height: '2.5em', lineHeight: 1.25, overflow: 'hidden' }}>
                        <Link href={`/products/${prod.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {prod.name}
                        </Link>
                      </h3>

                    </div>

                    <div>
                      {/* Price Section */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.55rem', flexWrap: 'wrap' }}>
                        <span className="catalog-card-price" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0d52bf' }}>
                          {formatINR(price)}
                        </span>
                        {mrp > price && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {formatINR(mrp)}
                          </span>
                        )}
                      </div>

                      {/* Button */}
                      <Link
                        href={`/products/${prod.slug}`}
                        className="btn catalog-card-btn"
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          backgroundColor: '#0d52bf',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          padding: '0.48rem 0.5rem',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          boxShadow: '0 2px 6px rgba(13, 82, 191, 0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: '2rem 1rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
              <Store size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                No Products Match Your Search Filter
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto 1.25rem auto', lineHeight: 1.4 }}>
                The catalog definitions exist in the store database. Sellable products with specific prices, stock counts, and photos can be created and activated via the Admin Dashboard.
              </p>

              {catalogDefinitions.length > 0 && (
                <div style={{ marginTop: '1.25rem', textAlign: 'left', backgroundColor: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                    Matching Catalog Categories / Product Types:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {catalogDefinitions.map((def) => (
                      <li key={def.id} style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle size={15} color="var(--primary-blue)" style={{ flexShrink: 0 }} />
                        <span><strong>{def.productType}</strong> ({def.subcategory.category.name}) — <em>{def.exampleBrands || 'All Brands'}</em></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
