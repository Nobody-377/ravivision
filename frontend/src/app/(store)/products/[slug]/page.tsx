import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/currency';
import { getStoreConfig } from '@/lib/store-config';
import { PincodeChecker } from '@/components/pincode/PincodeChecker';
import { ProductReviewsSection } from '@/components/reviews/ProductReviewsSection';
import { ShoppingCart, PhoneCall, ShieldCheck, Wrench, Truck, Check, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ProductActions } from './ProductActions';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    <div className="container pdp-container" style={{ padding: '2rem 1rem' }}>
      
      {/* Breadcrumb Bar */}
      <nav className="pdp-breadcrumb" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
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
      <div className="pdp-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left: Product Image / Gallery */}
        <div>
          {(() => {
            const validImages = (product.images || []).filter((img: any) => img?.url && !img.url.includes('unsplash.com'));
            return (
              <div className="card pdp-image-card" style={{ padding: '1.75rem', textAlign: 'center', backgroundColor: '#ffffff' }}>
                {validImages.length > 0 ? (
                  <img
                    src={validImages[0].url}
                    alt={product.name}
                    style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain', margin: '0 auto' }}
                  />
                ) : (
                  <div style={{
                    height: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--surface-subtle)',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    textAlign: 'center'
                  }}>
                    <ImageIcon size={44} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '0.25rem' }}>
                      {product.brand}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>
                      Photos will be updated soon
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Key Trust Signals */}
          <div className="pdp-trust-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
            <div className="card pdp-trust-card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.8125rem' }}>
              <Truck size={18} color="var(--primary-blue)" style={{ flexShrink: 0 }} />
              <span>~1-Day Local Delivery</span>
            </div>
            <div className="card pdp-trust-card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.8125rem' }}>
              <ShieldCheck size={18} color="var(--primary-blue)" style={{ flexShrink: 0 }} />
              <span>{product.warrantyInfo || 'Brand Warranty'}</span>
            </div>
          </div>
        </div>

        {/* Right: Details & Purchase Actions */}
        <div>
          <div className="pdp-brand" style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.brand}
          </div>

          <h1 className="pdp-title" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-heading)', margin: '0.25rem 0 0.5rem 0' }}>
            {product.name}
          </h1>

          <div className="pdp-meta-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <span
              style={{
                fontSize: '0.825rem',
                padding: '0.3rem 0.75rem',
                fontWeight: 800,
                borderRadius: '9999px',
                backgroundColor: !isOutOfStock ? '#dcfce7' : '#fee2e2',
                color: !isOutOfStock ? '#15803d' : '#b91c1c',
                border: !isOutOfStock ? '1px solid #bbf7d0' : '1px solid #fecaca',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {!isOutOfStock ? 'IN STOCK' : 'OUT OF STOCK'}
            </span>
          </div>

          {/* Pricing Box */}
          <div className="card pdp-price-box" style={{ padding: '1.15rem', backgroundColor: '#f8fafc', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="pdp-price-val" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                {formatINR(product.price)}
              </span>
              {product.mrp.toNumber() > product.price.toNumber() && (
                <>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    MRP: {formatINR(product.mrp)}
                  </span>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
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
            <div className="pdp-install-banner" style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
              color: '#1e40af',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1.25rem',
            }}>
              <Wrench size={18} color="#1d4ed8" style={{ flexShrink: 0 }} />
              <div>
                <strong>Installation Service Available:</strong> {product.installationDetails || 'Local technician installation provided upon delivery.'}
              </div>
            </div>
          )}

          {/* Interactive Client Actions: Add to Cart / Buy Now / Call to Order */}
          <ProductActions
            productId={product.id}
            isOutOfStock={isOutOfStock}
            stock={product.stock}
            phone={storeConfig.phone}
            storeName={storeConfig.storeName}
            openingHours={storeConfig.openingHours}
          />

          {/* Pincode Availability Checker */}
          <div style={{ marginTop: '1.5rem' }}>
            <PincodeChecker />
          </div>

          {/* Technical Specifications */}
          {Object.keys(specsObj).length > 0 && (
            <div className="pdp-specs-wrapper" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.65rem' }}>
                Technical Specifications
              </h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <table className="pdp-spec-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <tbody>
                    {Object.entries(specsObj).map(([key, val], idx) => (
                      <tr key={key} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '0.55rem 0.85rem', fontWeight: 600, color: 'var(--text-muted)', width: '40%', borderBottom: '1px solid var(--border-light)' }}>
                          {key}
                        </td>
                        <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text-heading)', borderBottom: '1px solid var(--border-light)' }}>
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customer Ratings & Real-Time Review Section */}
          <ProductReviewsSection productId={product.id} productName={product.name} />
        </div>
      </div>
    </div>
  );
}
