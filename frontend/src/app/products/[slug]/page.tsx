import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/currency';
import { getStoreConfig } from '@/lib/store-config';
import { PincodeChecker } from '@/components/pincode/PincodeChecker';
import { ShoppingCart, PhoneCall, ShieldCheck, Wrench, Truck, Check, ChevronRight } from 'lucide-react';
import { ProductActions } from './ProductActions';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
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
  });

  // Only allow active or out of stock products to be viewed publicly
  if (!product || (product.status !== 'ACTIVE' && product.status !== 'OUT_OF_STOCK')) {
    notFound();
  }

  const storeConfig = await getStoreConfig();

  // Parse specifications JSON
  let specsObj: Record<string, string> = {};
  if (product.specifications) {
    try {
      specsObj = JSON.parse(product.specifications);
    } catch {
      // Ignore parse error
    }
  }

  const isOutOfStock = product.stock <= 0 || product.status === 'OUT_OF_STOCK';

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      
      {/* Breadcrumb Bar */}
      <nav style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={14} />
        <Link href="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Products</Link>
        {product.productDefinition && (
          <>
            <ChevronRight size={14} />
            <Link
              href={`/products?department=${encodeURIComponent(product.productDefinition.subcategory.category.department.slug)}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {product.productDefinition.subcategory.category.department.name}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-heading)', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main Product PDP Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'flex-start' }}>
        
        {/* Left: Product Image / Gallery */}
        <div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
            {product.images.length > 0 ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', margin: '0 auto' }}
              />
            ) : (
              <div style={{
                height: '320px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '0.5rem' }}>
                  {product.brand}
                </div>
                <div style={{ fontSize: '0.875rem' }}>Official Product Placeholder</div>
              </div>
            )}
          </div>

          {/* Key Trust Signals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
            <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <Truck size={20} color="var(--primary-blue)" />
              <span>~1-Day Local Delivery</span>
            </div>
            <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
              <ShieldCheck size={20} color="var(--primary-blue)" />
              <span>{product.warrantyInfo || 'Brand Warranty'}</span>
            </div>
          </div>
        </div>

        {/* Right: Details & Purchase Actions */}
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.brand}
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0.25rem 0 0.5rem 0' }}>
            {product.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>SKU: <strong>{product.sku}</strong></span>
            <span className={`badge ${!isOutOfStock ? 'badge-success' : 'badge-warning'}`}>
              {!isOutOfStock ? `In Stock (${product.stock} units)` : 'Out of Stock'}
            </span>
          </div>

          {/* Pricing Box */}
          <div className="card" style={{ padding: '1.25rem', backgroundColor: '#f8fafc', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                {formatINR(product.price)}
              </span>
              {product.mrp.toNumber() > product.price.toNumber() && (
                <>
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    MRP: {formatINR(product.mrp)}
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '0.8125rem' }}>
                    Save {formatINR(product.mrp.toNumber() - product.price.toNumber())}
                  </span>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Inclusive of all taxes & local store handling
            </div>
          </div>

          {/* Installation Banner if applicable */}
          {product.requiresInstallation && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 'var(--radius-sm)',
              padding: '0.875rem',
              color: '#1e40af',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1.5rem',
            }}>
              <Wrench size={20} color="#1d4ed8" style={{ flexShrink: 0 }} />
              <div>
                <strong>Installation Service Available:</strong> {product.installationDetails || 'Local technician installation provided upon delivery.'}
              </div>
            </div>
          )}

          {/* Interactive Client Actions: Add to Cart / Buy Now / Call to Order */}
          <ProductActions
            productId={product.id}
            isOutOfStock={isOutOfStock}
            phone={storeConfig.phone}
            storeName={storeConfig.storeName}
            openingHours={storeConfig.openingHours}
          />

          {/* Pincode Availability Checker */}
          <div style={{ marginTop: '2rem' }}>
            <PincodeChecker />
          </div>

          {/* Technical Specifications */}
          {Object.keys(specsObj).length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.75rem' }}>
                Technical Specifications
              </h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <tbody>
                    {Object.entries(specsObj).map(([key, val], idx) => (
                      <tr key={key} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '0.625rem 1rem', fontWeight: 600, color: 'var(--text-muted)', width: '40%', borderBottom: '1px solid var(--border-light)' }}>
                          {key}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', color: 'var(--text-heading)', borderBottom: '1px solid var(--border-light)' }}>
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
