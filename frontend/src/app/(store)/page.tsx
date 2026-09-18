import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getStoreConfig } from '@/lib/store-config';
import { PincodeChecker } from '@/components/pincode/PincodeChecker';
import { 
  Truck, 
  PhoneCall, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  Heart, 
  Star, 
  MapPin, 
  Grid,
  LayoutGrid,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Snowflake,
  Wind,
  Fan,
  Shirt,
  BatteryCharging,
  Tv,
  Utensils,
  Check
} from 'lucide-react';
import { formatINR } from '@/lib/currency';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const storeConfig = await getStoreConfig();

  // Fetch active sellable products from Prisma DB
  const activeProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    take: 6,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Mock / Fallback Products matching the reference UI if DB has fewer items
  const fallbackProducts = [
    {
      id: 'fb-1',
      brand: 'Haier',
      name: '240L Double Door Refrigerator',
      slug: 'haier-240l-refrigerator',
      price: 24990,
      mrp: 30990,
      discount: '15% OFF',
      rating: '4.5',
      reviews: '120',
      image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80',
    },
    {
      id: 'fb-2',
      brand: 'Voltas',
      name: '1.5 Ton 3 Star Split AC',
      slug: 'voltas-1-5-ton-ac',
      price: 32990,
      mrp: 37990,
      discount: '12% OFF',
      rating: '4.4',
      reviews: '98',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    },
    {
      id: 'fb-3',
      brand: 'Symphony',
      name: 'Tower Air Cooler 70L',
      slug: 'symphony-tower-air-cooler',
      price: 8490,
      mrp: 10990,
      discount: '20% OFF',
      rating: '4.3',
      reviews: '76',
      image: 'https://images.unsplash.com/photo-1618941723684-84519965d1b7?w=400&q=80',
    },
  ];

  const displayProducts = activeProducts.length > 0 ? activeProducts : fallbackProducts;

  // Category Quick Links
  const quickCategories = [
    { name: 'Refrigerators', icon: <Snowflake size={26} color="#0284c7" />, slug: 'Refrigerators' },
    { name: 'AC', icon: <Wind size={26} color="#0d9488" />, slug: 'Air Conditioners' },
    { name: 'Coolers', icon: <Fan size={26} color="#2563eb" />, slug: 'Coolers' },
    { name: 'Washing Machines', icon: <Shirt size={26} color="#4f46e5" />, slug: 'Washing Machines' },
    { name: 'Fans', icon: <Fan size={26} color="#0284c7" />, slug: 'Fans' },
    { name: 'Inverters', icon: <BatteryCharging size={26} color="#d97706" />, slug: 'Inverters & Batteries' },
    { name: 'More Categories', icon: <LayoutGrid size={26} color="#475569" />, slug: '' },
  ];

  // Top Brands
  const topBrands = [
    { name: 'SAMSUNG', color: '#1428a0' },
    { name: 'LG', color: '#a50034' },
    { name: 'VOLTAS', color: '#005b9f' },
    { name: 'Haier', color: '#005aab' },
    { name: 'Whirlpool', color: '#fdb913' },
    { name: 'BAJAJ', color: '#0066b3' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '0.5rem' }}>
      
      {/* 1. Hero Banner Carousel Section */}
      <section className="container hero-banner-section" style={{ paddingTop: '0.75rem' }}>
        <div
          className="hero-banner-card"
          style={{
            backgroundImage: `linear-gradient(110deg, rgba(9, 54, 128, 0.95) 0%, rgba(13, 82, 191, 0.85) 55%, rgba(15, 23, 42, 0.55) 100%), url('/images/hero-appliances.jpg')`,
            backgroundPosition: 'center right',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            borderRadius: '20px',
            color: '#ffffff',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(9, 54, 128, 0.25)',
          }}
        >
          <div
            style={{
              maxWidth: '580px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <h1 className="hero-banner-title" style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.75rem', textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
              Upgrade Your Home <br />
              <span style={{ color: '#facc15' }}>with Trusted Brands</span>
            </h1>

            <div className="hero-banner-highlights" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.95 }}>
                <CheckCircle2 size={15} color="#facc15" /> Best Prices Guaranteed
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.95 }}>
                <CheckCircle2 size={15} color="#facc15" /> 100% Genuine Brand Products
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.95 }}>
                <CheckCircle2 size={15} color="#facc15" /> Local 1-Day Delivery to Kargahar & Surrounding
              </div>
            </div>

            <Link
              href="/products"
              className="hero-banner-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#093680',
                fontWeight: 800,
                fontSize: '0.875rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              }}
            >
              Shop Now <ArrowRight size={16} />
            </Link>
          </div>

          {/* Carousel Dots */}
          <div className="hero-carousel-dots" style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem', position: 'relative', zIndex: 2 }}>
            <span style={{ width: '18px', height: '6px', backgroundColor: '#ffffff', borderRadius: '4px' }}></span>
            <span style={{ width: '6px', height: '6px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '50%' }}></span>
            <span style={{ width: '6px', height: '6px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '50%' }}></span>
          </div>
        </div>
      </section>

      {/* 2. Quick Category Circles Row */}
      <section className="container">
        <div
          className="quick-categories-row"
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none',
          }}
        >
          {quickCategories.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.slug ? `/products?search=${encodeURIComponent(cat.name)}` : '/products'}
              className="quick-category-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                minWidth: '72px',
              }}
            >
              <div
                className="quick-category-circle"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.6rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                {cat.icon}
              </div>
              <span
                className="quick-category-label"
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: '#334155',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Check Delivery In Your Area Pincode Card */}
      <section className="container">
        <div
          className="pincode-card-wrapper"
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '14px',
            padding: '0.65rem 0.85rem',
          }}
        >
          <div className="pincode-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MapPin size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                Check Delivery in Your Area
              </h3>
              <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0, lineHeight: 1.2 }}>
                Enter 6-digit pincode to see delivery time & charges
              </p>
            </div>
          </div>

          <PincodeChecker compact />
        </div>
      </section>

      {/* 4. Four Store Value Highlights Row */}
      <section className="container store-highlights-section">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.5rem',
          }}
          className="store-highlights-grid"
        >
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Truck size={22} color="#2563eb" />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              1-Day Local Delivery
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <ShieldCheck size={22} color="#16a34a" />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              Genuine Brand Warranty
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <CreditCard size={22} color="#7c3aed" />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              Easy Payments (UPI/COD)
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '0.75rem 0.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <PhoneCall size={22} color="#059669" />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              Call to Order 9631410611
            </span>
          </div>
        </div>
      </section>

      {/* 5. Product Catalog Showcase Cards */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <div>
            <h2 className="section-title-heading" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.25 }}>
              Featured Local Store Appliances
            </h2>
          </div>
          <Link
            href="/products"
            style={{
              color: '#2563eb',
              fontSize: '0.8rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div
          className="product-grid-responsive"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {displayProducts.map((p: any) => {
            const price = Number(p.price || 0);
            const mrp = Number(p.mrp || price * 1.2);
            const discountPercentage = p.discount || (mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : null);
            const primaryImg = p.images && p.images[0]?.url ? p.images[0].url : (p.image || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80');

            return (
              <div
                key={p.id}
                className="product-card-mobile"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Top Badge & Wishlist Heart */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  {discountPercentage ? (
                    <span style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '0.625rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '9999px' }}>
                      {discountPercentage}
                    </span>
                  ) : <span />}

                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.15rem' }}>
                    <Heart size={16} />
                  </button>
                </div>

                {/* Product Image */}
                <Link href={`/products/${p.slug}`} className="product-card-img" style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', height: '140px' }}>
                  <img
                    src={primaryImg}
                    alt={p.name}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </Link>

                {/* Details */}
                <div style={{ marginTop: '0.35rem' }}>
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#2563eb' }}>
                    {p.brand}
                  </div>
                  <h3 className="product-card-title" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0.25rem 0', height: '2.4em', overflow: 'hidden' }}>
                    <Link href={`/products/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {p.name}
                    </Link>
                  </h3>

                  {/* Rating */}
                  <div className="product-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', color: '#64748b', marginBottom: '0.35rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#fef3c7', color: '#d97706', fontWeight: 800, padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                      <Star size={11} fill="#d97706" color="#d97706" /> {p.rating || '4.5'}
                    </span>
                    <span>({p.reviews || '120'})</span>
                  </div>

                  {/* Price */}
                  <div className="product-card-price" style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {formatINR(price)}
                    </span>
                    {mrp > price && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                        {formatINR(mrp)}
                      </span>
                    )}
                  </div>

                  {/* Badges (Desktop only or hidden on mobile to avoid card clutter) */}
                  <div className="product-card-badges" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem', fontSize: '0.6875rem' }}>
                    <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Zap size={11} fill="#047857" /> 1-Day Delivery
                    </span>
                    <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      EMI Available
                    </span>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      COD
                    </span>
                  </div>

                  <Link
                    href={`/products/${p.slug}`}
                    className="btn btn-primary product-card-btn"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      fontSize: '0.8125rem',
                      justifyContent: 'center',
                      borderRadius: '10px',
                    }}
                  >
                    <ShoppingBag size={14} /> Add to Cart
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
