import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/currency';
import { Search, Filter, CheckCircle, Store, ArrowRight } from 'lucide-react';

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
    <div className="container" style={{ padding: '2rem 1rem' }}>
      
      {/* Page Title & Search Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
          {search ? `Search Results for "${search}"` : 'Store Product Catalog'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Browse official electronics, appliances, and electrical items available at Ravi Vision.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) 1fr', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Sidebar Filter Panel */}
        <aside className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <Filter size={18} color="var(--primary-blue)" /> Filter Catalog
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Categories & Types
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
              <li>
                <Link
                  href="/products"
                  style={{
                    color: !departmentSlug && !categorySlug && !subcategorySlug ? 'var(--primary-blue)' : 'var(--text-body)',
                    fontWeight: !departmentSlug && !categorySlug && !subcategorySlug ? 700 : 500,
                    textDecoration: 'none',
                    display: 'block',
                    padding: '0.25rem 0',
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
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'block',
                      padding: '0.125rem 0',
                      fontSize: '0.875rem',
                    }}
                  >
                    {cat.name}
                  </Link>

                  {cat.subcategories.length > 0 && (
                    <ul style={{ listStyle: 'none', paddingLeft: '0.75rem', margin: '0.25rem 0 0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
        </aside>

        {/* Right Main Products Grid */}
        <div>
          {products.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}>
              {products.map((prod) => (
                <div key={prod.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                        {prod.brand}
                      </span>
                      <span className={`badge ${prod.stock > 0 ? 'badge-success' : 'badge-warning'}`}>
                        {prod.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', margin: '0.25rem 0 0.5rem 0' }}>
                      <Link href={`/products/${prod.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {prod.name}
                      </Link>
                    </h3>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      SKU: {prod.sku}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                        {formatINR(prod.price)}
                      </span>
                      {prod.mrp.toNumber() > prod.price.toNumber() && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatINR(prod.mrp)}
                        </span>
                      )}
                    </div>

                    <Link href={`/products/${prod.slug}`} className="btn btn-primary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.5rem' }}>
                      View Product
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              <Store size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                No Sellable SKUs Match Your Search Filter
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto 1.5rem auto' }}>
                The Excel catalog taxonomy definitions exist in the store database. Sellable products with specific SKUs, prices, stock counts, and photos can be created and activated via the Admin Dashboard.
              </p>

              {catalogDefinitions.length > 0 && (
                <div style={{ marginTop: '1.5rem', textAlign: 'left', backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.75rem' }}>
                    Matching Catalog Categories / Product Types:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {catalogDefinitions.map((def) => (
                      <li key={def.id} style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="var(--primary-blue)" />
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
