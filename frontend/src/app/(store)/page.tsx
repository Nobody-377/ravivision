import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getStoreConfig } from '@/lib/store-config';
import { PincodeChecker } from '@/components/pincode/PincodeChecker';
import { Truck, PhoneCall, ShieldCheck, ShoppingBag, ArrowRight, Store, CheckCircle } from 'lucide-react';
import { formatINR } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const storeConfig = await getStoreConfig();

  // Fetch primary categories with subcategories & department info
  const primaryCategories = await prisma.category.findMany({
    include: {
      department: true,
      subcategories: {
        take: 3,
      },
    },
    orderBy: { name: 'asc' },
  });

  // Fetch active sellable products
  const activeProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    take: 8,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCatalogDefinitions = await prisma.productDefinition.count();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Hero Banner Section */}
      <section style={{
        backgroundColor: 'var(--primary-blue)',
        color: '#ffffff',
        padding: '3.5rem 0',
        background: 'linear-gradient(135deg, #093680 0%, #0d52bf 60%, #1a73e8 100%)',
      }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '0.375rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}>
              <Store size={16} color="#facc15" /> Official Local Electronics & Appliance Store
            </div>
            
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
              Order Online for Fast <span style={{ color: '#facc15' }}>~1-Day Local Delivery</span>
            </h1>
            
            <p style={{ fontSize: '1.0625rem', color: '#e2e8f0', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Serving your city with genuine home appliances, electricals, and kitchenware. Order online or call our store team directly for assistance.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/products" className="btn" style={{ backgroundColor: '#ffffff', color: 'var(--primary-blue)', fontWeight: 700, padding: '0.875rem 1.5rem' }}>
                <ShoppingBag size={18} /> Browse Catalog
              </Link>
              
              <Link href="/products" className="btn btn-outline" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}>
                View All Categories <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Hero Right: Pincode Availability Checker Widget */}
          <div>
            <div className="card" style={{ padding: '1.75rem', backgroundColor: '#ffffff', color: 'var(--text-body)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
                Check Delivery in Your Area
              </h3>
              <p style={{ fontSize: '0.84375rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Enter your 6-digit local pincode to verify ~1-day local delivery eligibility and delivery charges.
              </p>
              
              <PincodeChecker />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: '#eff6ff', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Truck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>~1-Day Local Delivery</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Direct store delivery for eligible pincodes</p>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PhoneCall size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>Call to Order</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Speak with our store team directly</p>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-heading)' }}>Brand Warranty</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>100% genuine brand manufacturer products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Product Categories Section */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Primary Catalog Categories
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              Shop Electronics & Home Appliances
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Browse genuine appliances and electricals by primary category available at Ravi Vision
            </p>
          </div>
          
          <Link href="/products" className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
            View All Products <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.25rem',
        }}>
          {primaryCategories.map((cat) => (
            <div key={cat.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '0.75rem' }}>
                  {cat.name}
                </h3>

                {cat.subcategories.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {cat.subcategories.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/products?category=${encodeURIComponent(cat.slug)}&subcategory=${encodeURIComponent(sub.slug)}`}
                          style={{ fontSize: '0.8125rem', color: 'var(--text-body)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                        >
                          <CheckCircle size={13} color="var(--primary-blue)" /> {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                href={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem', padding: '0.5rem', width: '100%', textDecoration: 'none', justifyContent: 'center' }}
              >
                Explore {cat.name} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Sellable Products Section */}
      <section className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)' }}>
            Featured Products In Stock
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real sellable store inventory active for local order or phone booking
          </p>
        </div>

        {activeProducts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}>
            {activeProducts.map((prod) => (
              <div key={prod.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase' }}>
                    {prod.brand}
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-heading)', margin: '0.25rem 0 0.5rem 0' }}>
                    <Link href={`/products/${prod.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {prod.name}
                    </Link>
                  </h4>
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
                    View Product Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '0.5rem' }}>
              No Sellable Products Currently Active
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 1.5rem auto' }}>
              Browse our full product catalog or contact customer support for product availability.
            </p>
            <Link href="/products" className="btn btn-primary" style={{ padding: '0.625rem 1.25rem' }}>
              View Catalog
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}
