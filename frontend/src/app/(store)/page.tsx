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
  Flame,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import { formatINR } from '@/lib/currency';

import { HeroBannerCarousel } from '@/components/home/HeroBannerCarousel';
import { BrandBestSellersCarousel } from '@/components/home/BrandBestSellersCarousel';
import { QuickCategoriesRow } from '@/components/home/QuickCategoriesRow';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const storeConfig = await getStoreConfig();

  let rawProducts: any[] = [];
  try {
    rawProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      take: 6,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch rawProducts from DB in HomePage:', error);
    rawProducts = [];
  }

  const productIds = rawProducts.map((p) => p.id);
  let allReviews: Array<{ productId: string; rating: number }> = [];
  try {
    allReviews = await (prisma as any).productReview.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, rating: true },
    });
  } catch {
    allReviews = [];
  }

  const activeProducts = rawProducts.map((p) => {
    const pRevs = allReviews.filter((r) => r.productId === p.id);
    return {
      ...p,
      reviews: pRevs,
    };
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
      image: '',
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
      image: '',
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
      image: '',
    },
  ];

  const displayProducts = activeProducts.length > 0 ? activeProducts : fallbackProducts;

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
      <HeroBannerCarousel />

      {/* 2. Top Brand Best Sellers Carousel (LG, Havells, Samsung, Voltas, Daikin, Haier, Godrej, Whirlpool, Panasonic, Sony, Bosch) */}
      <BrandBestSellersCarousel />

      {/* 3. Quick Category Circles Row with More Categories Incoming Popup */}
      <QuickCategoriesRow />

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
            const rawImg = p.images && p.images[0]?.url ? p.images[0].url : p.image;
            const hasPhoto = rawImg && typeof rawImg === 'string' && rawImg.trim() !== '' && !rawImg.includes('unsplash.com');
            const primaryImg = hasPhoto ? rawImg : null;

            const pRevList = Array.isArray(p.reviews) ? p.reviews : [];
            const realRevCount = pRevList.length;
            const realAvgRating = realRevCount > 0
              ? (pRevList.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / realRevCount).toFixed(1)
              : null;

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
                {/* Product Image */}
                <Link href={`/products/${p.slug}`} className="product-card-img" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0.5rem', height: '140px', backgroundColor: '#f8fafc', borderRadius: '12px', overflow: 'hidden' }}>
                  {primaryImg ? (
                    <img
                      src={primaryImg}
                      alt={p.name}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      height: '100%',
                      width: '100%',
                      color: '#64748b',
                      padding: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <ImageIcon size={26} color="#94a3b8" />
                      <span style={{ fontSize: '0.725rem', fontWeight: 600, lineHeight: 1.2, color: '#64748b' }}>
                        Photos will be updated soon
                      </span>
                    </div>
                  )}
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

                  {/* Rating (Real DB Ratings) */}
                  <div className="product-card-rating" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', color: '#64748b', marginBottom: '0.35rem' }}>
                    {realRevCount > 0 ? (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', backgroundColor: '#fef3c7', color: '#d97706', fontWeight: 800, padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                          <Star size={11} fill="#d97706" color="#d97706" /> {realAvgRating}
                        </span>
                        <span>({realRevCount})</span>
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>No ratings yet</span>
                    )}
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

      {/* 6. Check Delivery In Your Area Pincode Card (Above Footer) */}
      <section className="container" style={{ marginTop: '0.5rem' }}>
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
    </div>
  );
}
