import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/currency';
import { getStoreConfig } from '@/lib/store-config';
import { Search, Filter, CheckCircle, Store, ArrowRight, ChevronDown, PhoneCall, Image as ImageIcon } from 'lucide-react';
import { CatalogFilterSidebar } from '@/components/navigation/CatalogFilterSidebar';

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
  const storeConfig = await getStoreConfig();
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

  const categoryFilters: any[] = [];
  if (subcategorySlug) {
    const decodedSub = decodeURIComponent(subcategorySlug);
    categoryFilters.push({
      OR: [
        { subcategory: { slug: { equals: subcategorySlug, mode: 'insensitive' } } },
        { subcategory: { slug: { equals: decodedSub, mode: 'insensitive' } } },
        { subcategory: { name: { equals: decodedSub, mode: 'insensitive' } } },
      ],
    });
  } else if (categorySlug) {
    const decodedCat = decodeURIComponent(categorySlug);
    categoryFilters.push({
      OR: [
        { category: { slug: { equals: categorySlug, mode: 'insensitive' } } },
        { category: { slug: { equals: decodedCat, mode: 'insensitive' } } },
        { category: { name: { equals: decodedCat, mode: 'insensitive' } } },
        { subcategory: { category: { slug: { equals: categorySlug, mode: 'insensitive' } } } },
      ],
    });
  } else if (departmentSlug) {
    const decodedDept = decodeURIComponent(departmentSlug);
    categoryFilters.push({
      OR: [
        { category: { department: { slug: { equals: departmentSlug, mode: 'insensitive' } } } },
        { category: { department: { slug: { equals: decodedDept, mode: 'insensitive' } } } },
        { category: { department: { name: { equals: decodedDept, mode: 'insensitive' } } } },
      ],
    });
  }

  if (categoryFilters.length > 0) {
    whereClause.AND = categoryFilters;
  }

  let products: any[] = [];
  let categories: any[] = [];
  let catalogDefinitions: any[] = [];

  try {
    products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: {
          include: {
            department: true,
          },
        },
        subcategory: true,
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

    categories = await prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    catalogDefinitions = search
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
  } catch (error) {
    console.error('Failed to query ProductsPage DB:', error);
    products = [];
    categories = [];
    catalogDefinitions = [];
  }

  return (
    <div className="container products-page-container">
      
      {/* Page Title & Search Header */}
      <div className="products-page-header" style={{ marginBottom: '1.25rem' }}>
        <h1 className="products-page-title" style={{ margin: 0 }}>
          {search ? `Search Results for "${search}"` : 'Store Product Catalog'}
        </h1>
      </div>

      {/* Horizontal Category Quick Filter Pills for Mobile & Desktop */}
      <div
        className="category-quick-pills"
        style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.65rem',
          marginBottom: '1.25rem',
          scrollbarWidth: 'none',
        }}
      >
        <Link
          href="/products"
          style={{
            whiteSpace: 'nowrap',
            padding: '0.45rem 1.15rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: !categorySlug ? 800 : 600,
            backgroundColor: !categorySlug ? 'var(--primary-blue)' : '#f1f5f9',
            color: !categorySlug ? '#ffffff' : '#334155',
            textDecoration: 'none',
            flexShrink: 0,
            border: !categorySlug ? 'none' : '1px solid #e2e8f0',
            boxShadow: !categorySlug ? '0 2px 8px rgba(13, 82, 191, 0.25)' : 'none',
            transition: 'all 0.15s ease',
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
                padding: '0.45rem 1.15rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 800 : 600,
                backgroundColor: isActive ? 'var(--primary-blue)' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#334155',
                textDecoration: 'none',
                flexShrink: 0,
                border: isActive ? 'none' : '1px solid #e2e8f0',
                boxShadow: isActive ? '0 2px 8px rgba(13, 82, 191, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      <div className="catalog-layout-grid" style={{ width: '100%' }}>
        
        {/* Left Sidebar Filter Panel */}
        <CatalogFilterSidebar
          categories={categories}
          departmentSlug={departmentSlug}
          categorySlug={categorySlug}
          subcategorySlug={subcategorySlug}
        />

        {/* Right Main Products Grid */}
        <div>
          {products.length > 0 ? (
            <div className="catalog-products-grid">
              {products.map((prod) => {
                const rawImg = prod.images && prod.images[0]?.url ? prod.images[0].url : (prod as any).image;
                const hasPhoto = rawImg && typeof rawImg === 'string' && rawImg.trim() !== '' && !rawImg.includes('unsplash.com');
                const primaryImg = hasPhoto ? rawImg : null;
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
                      <Link href={`/products/${prod.slug}`} className="catalog-card-img" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '110px', padding: '0.25rem', marginBottom: '0.5rem', textDecoration: 'none', backgroundColor: '#f8fafc', borderRadius: '10px', overflow: 'hidden' }}>
                        {primaryImg ? (
                          <img
                            src={primaryImg}
                            alt={prod.name}
                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', height: '100%', width: '100%', color: '#64748b', padding: '0.25rem', textAlign: 'center' }}>
                            <ImageIcon size={22} color="#94a3b8" />
                            <span style={{ fontSize: '0.675rem', fontWeight: 600, lineHeight: 1.2, color: '#64748b' }}>
                              Photos will be updated soon
                            </span>
                          </div>
                        )}
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
            <div className="card" style={{ padding: '2.5rem 1.25rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Store size={28} />
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
                No Products Found
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '480px', margin: '0 auto 1.25rem auto', lineHeight: 1.5 }}>
                We couldn't find any products matching your selected category or filter right now. Try clearing your filters, exploring another category, or contact our store team for stock inquiries.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <Link
                  href="/products"
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', fontWeight: 700, borderRadius: '10px' }}
                >
                  View All Products
                </Link>
                <a
                  href={`tel:${storeConfig.phone || '9631410611'}`}
                  className="btn btn-phone"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', fontWeight: 700, borderRadius: '10px', textDecoration: 'none' }}
                >
                  <PhoneCall size={14} /> Call Store for Stock
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
