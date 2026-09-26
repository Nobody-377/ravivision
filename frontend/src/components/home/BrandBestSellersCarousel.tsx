'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  ArrowRight,
  LayoutGrid,
  Image as ImageIcon 
} from 'lucide-react';
import { formatINR } from '@/lib/currency';

export interface BrandProduct {
  id: string;
  brand: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  discount?: string;
  rating: string | number;
  reviewsCount: number;
  image?: string;
  tagline?: string;
  warranty?: string;
}

export interface BrandItem {
  id: string;
  name: string;
  color: string;
  logoSvg: React.ReactNode;
  logoUrl?: string;
}

// Brand SVG Logos & Images perfectly dimensioned for visual balance and consistency across all cards
const TOP_BRANDS: BrandItem[] = [
  {
    id: 'ALL',
    name: 'All Brands',
    color: '#2563eb',
    logoSvg: (
      <svg viewBox="0 0 32 32" width="24" height="24" fill="none">
        <rect x="4" y="4" width="10" height="10" rx="2.5" fill="#2563eb" />
        <rect x="18" y="4" width="10" height="10" rx="2.5" fill="#2563eb" />
        <rect x="4" y="18" width="10" height="10" rx="2.5" fill="#2563eb" />
        <rect x="18" y="18" width="10" height="10" rx="2.5" fill="#2563eb" />
      </svg>
    ),
  },
  {
    id: 'LG',
    name: 'LG',
    color: '#a50034',
    logoUrl: '/images/brands/lg.jpg',
    logoSvg: (
      <svg viewBox="0 0 36 36" width="28" height="28" fill="none">
        <circle cx="18" cy="18" r="16" fill="#a50034" />
        <path d="M 22 10.5 A 9.5 9.5 0 1 0 25.5 21 H 18" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 18 12 V 21 H 23" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="13.2" cy="15.2" r="1.6" fill="#ffffff" />
      </svg>
    ),
  },
  {
    id: 'Havells',
    name: 'Havells',
    color: '#e31e24',
    logoUrl: '/images/brands/havells.jpg',
    logoSvg: (
      <svg viewBox="0 0 40 32" width="30" height="25" fill="none">
        <path d="M 4 4 H 11 V 28 H 4 Z" fill="#e31e24" />
        <path d="M 29 4 H 36 V 28 H 29 Z" fill="#e31e24" />
        <path d="M 4 13 H 36 V 19 H 4 Z" fill="#e31e24" />
        <path d="M 11 4 L 29 28 H 21 L 11 14 Z" fill="#e31e24" />
      </svg>
    ),
  },
  {
    id: 'Samsung',
    name: 'Samsung',
    color: '#1428a0',
    logoUrl: '/images/brands/samsung.jpg',
    logoSvg: (
      <svg viewBox="0 0 100 32" width="64" height="22" fill="none">
        <ellipse cx="50" cy="16" rx="48" ry="14" fill="#1428a0" transform="rotate(-5 50 16)" />
        <text x="50" y="21" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="13" fill="#ffffff" textAnchor="middle" letterSpacing="1.2">SAMSUNG</text>
      </svg>
    ),
  },
  {
    id: 'Voltas',
    name: 'Voltas',
    color: '#005b9f',
    logoUrl: '/images/brands/voltas.jpg',
    logoSvg: (
      <svg viewBox="0 0 100 28" width="62" height="20" fill="none">
        <text x="50" y="21" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontStyle="italic" fontSize="21" fill="#005b9f" textAnchor="middle" letterSpacing="0.8">VOLTAS</text>
      </svg>
    ),
  },
  {
    id: 'Daikin',
    name: 'Daikin',
    color: '#0099e5',
    logoUrl: '/images/brands/daikin.jpg',
    logoSvg: (
      <svg viewBox="0 0 100 28" width="62" height="20" fill="none">
        <polygon points="4,22 20,4 20,22" fill="#0099e5" />
        <text x="62" y="21" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="16" fill="#0099e5" textAnchor="middle" letterSpacing="0.5">DAIKIN</text>
      </svg>
    ),
  },
  {
    id: 'Haier',
    name: 'Haier',
    color: '#005aab',
    logoUrl: '/images/brands/haier.jpg',
    logoSvg: (
      <svg viewBox="0 0 90 28" width="58" height="20" fill="none">
        <text x="45" y="22" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="23" fill="#005aab" textAnchor="middle" letterSpacing="-0.5">Haier</text>
      </svg>
    ),
  },
  {
    id: 'Godrej',
    name: 'Godrej',
    color: '#e11b22',
    logoUrl: '/images/brands/godrej.jpg',
    logoSvg: (
      <svg viewBox="0 0 90 30" width="60" height="22" fill="none">
        <text x="45" y="23" fontFamily="'Brush Script MT', 'Lucida Calligraphy', cursive, sans-serif" fontWeight="bold" fontSize="26" fill="#e11b22" textAnchor="middle">Godrej</text>
      </svg>
    ),
  },
  {
    id: 'Whirlpool',
    name: 'Whirlpool',
    color: '#d97706',
    logoUrl: '/images/brands/whirlpool.jpg',
    logoSvg: (
      <svg viewBox="0 0 110 32" width="64" height="22" fill="none">
        <ellipse cx="62" cy="16" rx="28" ry="11" stroke="#eab308" strokeWidth="2.5" fill="none" transform="rotate(-18 62 16)" />
        <text x="54" y="21" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="15" fill="#0f172a" textAnchor="middle" letterSpacing="-0.3">Whirlpool</text>
      </svg>
    ),
  },
  {
    id: 'Panasonic',
    name: 'Panasonic',
    color: '#004098',
    logoUrl: '/images/brands/panasonic.jpg',
    logoSvg: (
      <svg viewBox="0 0 110 28" width="64" height="20" fill="none">
        <text x="55" y="21" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="18" fill="#004098" textAnchor="middle" letterSpacing="0.8">Panasonic</text>
      </svg>
    ),
  },
  {
    id: 'Sony',
    name: 'Sony',
    color: '#000000',
    logoUrl: '/images/brands/sony.jpg',
    logoSvg: (
      <svg viewBox="0 0 80 28" width="60" height="20" fill="none">
        <text x="40" y="21" fontFamily="'Times New Roman', Times, serif" fontWeight="900" fontSize="23" fill="#000000" textAnchor="middle" letterSpacing="2.5">SONY</text>
      </svg>
    ),
  },
  {
    id: 'Bosch',
    name: 'Bosch',
    color: '#e11b22',
    logoSvg: (
      <svg viewBox="0 0 75 30" width="56" height="22" fill="none">
        <circle cx="37.5" cy="9" r="7" fill="none" stroke="#000000" strokeWidth="1.8" />
        <path d="M34 5 v8 M41 5 v8 M34 9 h7" stroke="#000000" strokeWidth="1.6" strokeLinecap="round" />
        <text x="37.5" y="27" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="11" fill="#e11b22" textAnchor="middle" letterSpacing="0.8">BOSCH</text>
      </svg>
    ),
  },
  {
    id: 'Bajaj',
    name: 'Bajaj',
    color: '#0066b3',
    logoSvg: (
      <svg viewBox="0 0 100 32" width="60" height="20" fill="none">
        <path d="M8 20 L20 4 L32 20 L26 20 L20 12 L14 20 Z" fill="#0066b3" />
        <text x="66" y="22" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="18" fill="#0066b3" textAnchor="middle" letterSpacing="0.5">BAJAJ</text>
      </svg>
    ),
  },
  {
    id: 'Crompton',
    name: 'Crompton',
    color: '#00509e',
    logoSvg: (
      <svg viewBox="0 0 110 30" width="64" height="20" fill="none">
        <text x="55" y="22" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="18" fill="#00509e" textAnchor="middle" letterSpacing="0.5">Crompton</text>
      </svg>
    ),
  },
  {
    id: 'Orient',
    name: 'Orient',
    color: '#f37021',
    logoSvg: (
      <svg viewBox="0 0 100 32" width="60" height="20" fill="none">
        <circle cx="14" cy="16" r="9" fill="#f37021" />
        <text x="60" y="17" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="13" fill="#f37021" textAnchor="middle">orient</text>
        <text x="60" y="27" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="9" fill="#64748b" textAnchor="middle">electric</text>
      </svg>
    ),
  },
  {
    id: 'Usha',
    name: 'Usha',
    color: '#d32f2f',
    logoSvg: (
      <svg viewBox="0 0 90 30" width="58" height="20" fill="none">
        <text x="45" y="23" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="23" fill="#d32f2f" textAnchor="middle" letterSpacing="1">USHA</text>
      </svg>
    ),
  },
  {
    id: 'Philips',
    name: 'Philips',
    color: '#0b5cff',
    logoSvg: (
      <svg viewBox="0 0 100 30" width="60" height="20" fill="none">
        <text x="50" y="23" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="20" fill="#0b5cff" textAnchor="middle" letterSpacing="1">PHILIPS</text>
      </svg>
    ),
  },
  {
    id: 'McCoy',
    name: 'McCoy',
    color: '#d32f2f',
    logoSvg: (
      <svg viewBox="0 0 90 30" width="58" height="20" fill="none">
        <text x="45" y="23" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="21" fill="#d32f2f" textAnchor="middle">McCoy</text>
      </svg>
    ),
  },
];

// Fallback products for all top brands
const FALLBACK_BRAND_BESTSELLERS: BrandProduct[] = [
  // LG
  {
    id: 'lg-ac-1',
    brand: 'LG',
    name: '1.5 Ton 5 Star AI Dual Inverter Split AC',
    slug: 'lg-1-5-ton-5-star-split-ac',
    price: 44990,
    mrp: 68990,
    discount: '34% OFF',
    rating: 4.8,
    reviewsCount: 312,
    image: '',
    tagline: 'Dual Inverter & 6-in-1 Cooling',
    warranty: '10 Year Compressor Warranty',
  },
  {
    id: 'lg-ref-1',
    brand: 'LG',
    name: '242L 3 Star Frost Free Double Door Refrigerator',
    slug: 'lg-242l-double-door-refrigerator',
    price: 26990,
    mrp: 37990,
    discount: '28% OFF',
    rating: 4.7,
    reviewsCount: 245,
    image: '',
    tagline: 'Smart Inverter Compressor',
    warranty: '10 Year Compressor Warranty',
  },
  {
    id: 'lg-wm-1',
    brand: 'LG',
    name: '7.0 Kg 5 Star Inverter Fully Automatic Front Load',
    slug: 'lg-7kg-front-load-washing-machine',
    price: 29990,
    mrp: 43990,
    discount: '31% OFF',
    rating: 4.9,
    reviewsCount: 189,
    image: '',
    tagline: '6 Motion Direct Drive Tech',
    warranty: '10 Year Motor Warranty',
  },

  // Havells
  {
    id: 'havells-fan-1',
    brand: 'Havells',
    name: 'Stealth Air 1200mm Decorative Ceiling Fan',
    slug: 'havells-stealth-air-ceiling-fan',
    price: 4890,
    mrp: 6590,
    discount: '25% OFF',
    rating: 4.7,
    reviewsCount: 520,
    image: '',
    tagline: 'Dust Resistant & Super Silent',
    warranty: '2 Year On-Site Warranty',
  },
  {
    id: 'havells-geyser-1',
    brand: 'Havells',
    name: 'Instanio 3L 3000W Instant Water Heater / Geyser',
    slug: 'havells-instanio-3l-instant-geyser',
    price: 3490,
    mrp: 5890,
    discount: '40% OFF',
    rating: 4.8,
    reviewsCount: 388,
    image: '',
    tagline: 'Color Changing LED Indicator',
    warranty: '7 Year Tank Warranty',
  },

  // Samsung
  {
    id: 'sam-ref-1',
    brand: 'Samsung',
    name: '236L 3 Star Digital Inverter Double Door Refrigerator',
    slug: 'samsung-236l-double-door-refrigerator',
    price: 25990,
    mrp: 37990,
    discount: '31% OFF',
    rating: 4.8,
    reviewsCount: 290,
    image: '',
    tagline: 'Convertible 3-in-1 & Coolpack',
    warranty: '20 Year Compressor Warranty',
  },
  {
    id: 'sam-tv-1',
    brand: 'Samsung',
    name: '55 Inch Crystal 4K UHD Smart TV (CU7000)',
    slug: 'samsung-55-inch-crystal-4k-smart-tv',
    price: 45990,
    mrp: 69900,
    discount: '34% OFF',
    rating: 4.8,
    reviewsCount: 510,
    image: '',
    tagline: 'PurColor & Crystal Processor 4K',
    warranty: '2 Year Panel Warranty',
  },

  // Voltas
  {
    id: 'voltas-ac-1',
    brand: 'Voltas',
    name: '1.5 Ton 3 Star Inverter Split AC (183V Vectra Prism)',
    slug: 'voltas-1-5-ton-3-star-split-ac',
    price: 32990,
    mrp: 64990,
    discount: '49% OFF',
    rating: 4.5,
    reviewsCount: 432,
    image: '',
    tagline: '4-in-1 Adjustable Cooling',
    warranty: '10 Year Compressor Warranty',
  },
  {
    id: 'voltas-cooler-1',
    brand: 'Voltas',
    name: '70L Desert Air Cooler (Grand 70H)',
    slug: 'voltas-70l-desert-air-cooler',
    price: 9490,
    mrp: 14990,
    discount: '36% OFF',
    rating: 4.4,
    reviewsCount: 160,
    image: '',
    tagline: 'Honeycomb Pads & Turbo Airflow',
    warranty: '1 Year Brand Warranty',
  },

  // Daikin
  {
    id: 'daikin-ac-1',
    brand: 'Daikin',
    name: '1.5 Ton 5 Star Inverter Split AC (FTKM50U)',
    slug: 'daikin-1-5-ton-5-star-ac',
    price: 45490,
    mrp: 67200,
    discount: '32% OFF',
    rating: 4.9,
    reviewsCount: 380,
    image: '',
    tagline: '3D Airflow & PM 2.5 Filter',
    warranty: '10 Year Compressor Warranty',
  },

  // Haier
  {
    id: 'haier-ref-1',
    brand: 'Haier',
    name: '240L 3 Star Frost Free Double Door Refrigerator',
    slug: 'haier-240l-refrigerator',
    price: 24990,
    mrp: 34990,
    discount: '28% OFF',
    rating: 4.6,
    reviewsCount: 210,
    image: '',
    tagline: '14-in-1 Convertible & Twin Inverter',
    warranty: '10 Year Compressor Warranty',
  },

  // Godrej
  {
    id: 'godrej-ref-1',
    brand: 'Godrej',
    name: '180L 5 Star Direct Cool Single Door Refrigerator',
    slug: 'godrej-180l-refrigerator',
    price: 16990,
    mrp: 22490,
    discount: '24% OFF',
    rating: 4.5,
    reviewsCount: 175,
    image: '',
    tagline: 'Turbo Cooling & Inverter Tech',
    warranty: '10 Year Compressor Warranty',
  },

  // Whirlpool
  {
    id: 'wp-ref-1',
    brand: 'Whirlpool',
    name: '240L Multi-Door Triple Door Refrigerator (FP 263D)',
    slug: 'whirlpool-240l-triple-door-refrigerator',
    price: 27990,
    mrp: 38500,
    discount: '27% OFF',
    rating: 4.7,
    reviewsCount: 278,
    image: '',
    tagline: '6th Sense Microblock Technology',
    warranty: '10 Year Compressor Warranty',
  },

  // Panasonic
  {
    id: 'panasonic-tv-1',
    brand: 'Panasonic',
    name: '55 Inch 4K Ultra HD Smart LED Google TV',
    slug: 'panasonic-55-inch-4k-google-tv',
    price: 42990,
    mrp: 64990,
    discount: '33% OFF',
    rating: 4.7,
    reviewsCount: 195,
    image: '',
    tagline: '4K Color Engine & Dolby Atmos',
    warranty: '2 Year Panel Warranty',
  },

  // Sony
  {
    id: 'sony-tv-1',
    brand: 'Sony',
    name: 'Bravia 43 Inch 4K Ultra HD Smart LED TV (KD-43X74K)',
    slug: 'sony-bravia-43-inch-4k-tv',
    price: 41990,
    mrp: 59900,
    discount: '30% OFF',
    rating: 4.9,
    reviewsCount: 610,
    image: '',
    tagline: 'X1 4K Processor & Google TV',
    warranty: '3 Year Comprehensive Warranty',
  },

  // Bajaj
  {
    id: 'bajaj-grinder-1',
    brand: 'Bajaj',
    name: 'GX1 500W Mixer Grinder with 3 Stainless Steel Jars',
    slug: 'bajaj-gx1-500w-mixer-grinder',
    price: 2199,
    mrp: 4100,
    discount: '46% OFF',
    rating: 4.6,
    reviewsCount: 850,
    image: '',
    tagline: 'Overload Protector & Tough Steel Jars',
    warranty: '2 Year Product Warranty',
  },

  // Crompton
  {
    id: 'crompton-fan-1',
    brand: 'Crompton',
    name: 'Energion Hyperjet 1200mm BLDC Ceiling Fan with Remote',
    slug: 'crompton-energion-bldc-ceiling-fan',
    price: 3290,
    mrp: 5100,
    discount: '35% OFF',
    rating: 4.7,
    reviewsCount: 410,
    image: '',
    tagline: '5 Star 35W Energy Saver BLDC',
    warranty: '5 Year Warranty',
  },

  // Orient
  {
    id: 'orient-fan-1',
    brand: 'Orient',
    name: 'Electric Apex 1200mm High Speed Ceiling Fan',
    slug: 'orient-electric-apex-ceiling-fan',
    price: 1790,
    mrp: 2890,
    discount: '38% OFF',
    rating: 4.5,
    reviewsCount: 320,
    image: '',
    tagline: 'Super Air Delivery & Copper Motor',
    warranty: '2 Year Warranty',
  },

  // Usha
  {
    id: 'usha-iron-1',
    brand: 'Usha',
    name: 'Techne Direct 1000W Dry Iron with Non-Stick Plate',
    slug: 'usha-techne-1000w-dry-iron',
    price: 799,
    mrp: 1290,
    discount: '38% OFF',
    rating: 4.6,
    reviewsCount: 450,
    image: '',
    tagline: 'Thermal Fuse Safety & 360 Swivel',
    warranty: '2 Year Brand Warranty',
  },

  // Philips
  {
    id: 'philips-fryer-1',
    brand: 'Philips',
    name: 'Daily Collection HD9216/80 Air Fryer (4.1L)',
    slug: 'philips-daily-collection-air-fryer',
    price: 6490,
    mrp: 9995,
    discount: '35% OFF',
    rating: 4.8,
    reviewsCount: 520,
    image: '',
    tagline: 'Rapid Air Technology 90% Less Fat',
    warranty: '2 Year Worldwide Warranty',
  },

  // McCoy
  {
    id: 'mccoy-cooler-1',
    brand: 'McCoy',
    name: 'McCoy Air Coolers – Triton 50 WW Tower Cooler',
    slug: 'mccoy-air-coolers-triton-50-ww',
    price: 9850,
    mrp: 11999,
    discount: '18% OFF',
    rating: 4.5,
    reviewsCount: 140,
    image: '',
    tagline: 'Honeycomb Cooling Pad & Inverter Compatible',
    warranty: '1 Year Brand Warranty',
  },
];

interface BrandBestSellersCarouselProps {
  products?: BrandProduct[];
}

export function BrandBestSellersCarousel({ products: initialDbProducts }: BrandBestSellersCarouselProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [fetchedProducts, setFetchedProducts] = useState<BrandProduct[]>(initialDbProducts || []);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const brandRowRef = useRef<HTMLDivElement>(null);

  // Fetch live products from DB whenever brand selection changes
  useEffect(() => {
    let isSubscribed = true;
    async function loadBrandProducts() {
      try {
        const url = selectedBrand && selectedBrand !== 'ALL'
          ? `/api/products?brand=${encodeURIComponent(selectedBrand)}`
          : '/api/products';
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (isSubscribed && Array.isArray(json.data) && json.data.length > 0) {
            setFetchedProducts(json.data);
          }
        }
      } catch (err) {
        console.error('Error loading brand products:', err);
      }
    }
    loadBrandProducts();
    return () => { isSubscribed = false; };
  }, [selectedBrand]);

  const scrollBrandRow = (direction: 'left' | 'right') => {
    if (brandRowRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      brandRowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Dynamically filter products for the selected brand
  const filteredProducts = React.useMemo(() => {
    const candidateList = fetchedProducts.length > 0 ? fetchedProducts : (initialDbProducts || []);
    let matching = candidateList.filter((p) => {
      if (!selectedBrand || selectedBrand === 'ALL') return true;
      return p.brand.toUpperCase() === selectedBrand.toUpperCase();
    });

    if (matching.length > 0) {
      return matching;
    }

    if (selectedBrand && selectedBrand !== 'ALL') {
      const fallbackForBrand = FALLBACK_BRAND_BESTSELLERS.filter(
        (p) => p.brand.toUpperCase() === selectedBrand.toUpperCase()
      );
      if (fallbackForBrand.length > 0) return fallbackForBrand;
    }

    return FALLBACK_BRAND_BESTSELLERS;
  }, [fetchedProducts, initialDbProducts, selectedBrand]);

  const scrollProducts = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Auto scroll product carousel when not paused
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <section className="container top-brands-section" style={{ marginTop: '0.65rem', marginBottom: '0.65rem' }}>
      
      {/* 1. TOP BRANDS CAROUSEL SECTION */}
      <div style={{ marginBottom: '1.25rem' }}>
        {/* Section Title & View All Link */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2
            className="section-title-heading"
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Top Brands
          </h2>

          <Link
            href="/products"
            style={{
              color: '#2563eb',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
            }}
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {/* Compact White Capsule Bar Wrapper with Left/Right Nav Buttons */}
        <div
          style={{
            position: 'relative',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '0.5rem 0.5rem',
            boxShadow: '0 8px 30px rgba(37, 99, 235, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03)',
            border: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => scrollBrandRow('left')}
            aria-label="Scroll brands left"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
              e.currentTarget.style.color = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#334155';
            }}
            style={{
              position: 'absolute',
              left: '-14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
              zIndex: 10,
              transition: 'all 0.15s ease',
            }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Horizontal Brand Cards Row */}
          <div
            ref={brandRowRef}
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollBehavior: 'smooth',
              width: '100%',
              padding: '0.2rem 1rem',
            }}
          >
            {TOP_BRANDS.map((cat) => {
              const isSelected = selectedBrand.toUpperCase() === cat.id.toUpperCase();

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedBrand(cat.id)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02)';
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    padding: '0.45rem 0.35rem',
                    width: '82px',
                    minWidth: '82px',
                    maxWidth: '82px',
                    height: '76px',
                    borderRadius: '16px',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                    boxShadow: isSelected 
                      ? '0 4px 14px rgba(37, 99, 235, 0.18)' 
                      : '0 1px 3px rgba(0, 0, 0, 0.02)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  {/* Fixed Height Logo Container */}
                  <div 
                    style={{ 
                      width: '100%', 
                      height: '34px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    {cat.logoUrl ? (
                      <img
                        src={cat.logoUrl}
                        alt={cat.name}
                        style={{
                          maxHeight: '75px',
                          maxWidth: '120px',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          mixBlendMode: 'multiply',
                        }}
                      />
                    ) : (
                      cat.logoSvg
                    )}
                  </div>

                  {/* Brand Name Label */}
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: isSelected ? 800 : 700,
                      color: isSelected ? '#2563eb' : '#334155',
                      textAlign: 'center',
                      lineHeight: 1.15,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                    }}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() => scrollBrandRow('right')}
            aria-label="Scroll brands right"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
              e.currentTarget.style.color = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#334155';
            }}
            style={{
              position: 'absolute',
              right: '-14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)',
              zIndex: 10,
              transition: 'all 0.15s ease',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 2. BEST SELLERS CAROUSEL BY BRAND */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '1.15rem 1.15rem 1.25rem 1.15rem',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.85rem',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {selectedBrand !== 'ALL' ? `${selectedBrand} Best Sellers` : 'Bestsellers by Top Brands'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => scrollProducts('left')}
              aria-label="Scroll left"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollProducts('right')}
              aria-label="Scroll right"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel of Products */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            display: 'flex',
            gap: '0.85rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            paddingBottom: '0.35rem',
          }}
        >
          {filteredProducts.map((p) => {
            const price = Number(p.price);
            const mrp = Number(p.mrp);
            const discountPill = p.discount || (mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : null);
            const brandMeta = TOP_BRANDS.find((b) => b.id.toUpperCase() === p.brand.toUpperCase()) || TOP_BRANDS[0];

            return (
              <div
                key={p.id}
                style={{
                  minWidth: '235px',
                  maxWidth: '235px',
                  scrollSnapAlign: 'start',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {/* Top Badge: Brand Tag & Discount */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 800,
                      color: brandMeta.color,
                      backgroundColor: '#f8fafc',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      border: `1px solid ${brandMeta.color}35`,
                    }}
                  >
                    {p.brand}
                  </span>

                  {discountPill && (
                    <span
                      style={{
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        color: '#dc2626',
                        backgroundColor: '#fef2f2',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                      }}
                    >
                      {discountPill}
                    </span>
                  )}
                </div>

                {/* Product Image */}
                <Link
                  href={`/products/${p.slug}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '130px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    textDecoration: 'none',
                    overflow: 'hidden',
                  }}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        color: '#64748b',
                        textAlign: 'center',
                      }}
                    >
                      <ImageIcon size={26} color="#94a3b8" />
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', lineHeight: 1.2 }}>
                        Genuine {p.brand} Appliance
                      </span>
                    </div>
                  )}
                </Link>

                {/* Details & Pricing */}
                <div style={{ marginTop: '0.6rem' }}>
                  <h4
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: '0 0 0.3rem 0',
                      height: '2.5em',
                      overflow: 'hidden',
                      lineHeight: 1.25,
                    }}
                  >
                    <Link href={`/products/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {p.name}
                    </Link>
                  </h4>

                  {p.tagline && (
                    <div
                      style={{
                        fontSize: '0.675rem',
                        color: '#059669',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <Check size={12} color="#059669" /> {p.tagline}
                    </div>
                  )}

                  {/* Rating */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.7rem',
                      color: '#64748b',
                      marginBottom: '0.45rem',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        backgroundColor: '#fef3c7',
                        color: '#d97706',
                        fontWeight: 800,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                      }}
                    >
                      <Star size={11} fill="#d97706" color="#d97706" /> {p.rating}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>({p.reviewsCount} reviews)</span>
                  </div>

                  {/* Price */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.35rem',
                      marginBottom: '0.55rem',
                    }}
                  >
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
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      justifyContent: 'center',
                      borderRadius: '8px',
                      backgroundColor: brandMeta.color,
                      borderColor: brandMeta.color,
                    }}
                  >
                    <ShoppingBag size={13} /> View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
