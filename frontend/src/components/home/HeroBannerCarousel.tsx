'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSlide {
  id: string;
  titlePrefix: string;
  titleHighlight: string;
  highlights: string[];
  buttonText: string;
  buttonLink: string;
  bgImage: string;
  gradientOverlay: string;
  accentColor: string;
}

const slides: BannerSlide[] = [
  {
    id: 'slide-1',
    titlePrefix: 'Upgrade Your Home',
    titleHighlight: 'with Trusted Brands',
    highlights: [
      'Best Prices Guaranteed',
      '100% Genuine Brand Products',
      'Local 1-Day Delivery to Kargahar & Surrounding',
    ],
    buttonText: 'Shop Now',
    buttonLink: '/products',
    bgImage: '/images/hero-appliances.jpg',
    gradientOverlay: 'linear-gradient(110deg, rgba(9, 54, 128, 0.85) 0%, rgba(13, 82, 191, 0.5) 30%, rgba(15, 23, 42, 0.15) 70%, transparent 100%)',
    accentColor: '#facc15',
  },
  {
    id: 'slide-2',
    titlePrefix: 'Cool Comfort Solutions',
    titleHighlight: 'Beat the Summer Heat',
    highlights: [
      'Top-Rated Inverter ACs & Air Coolers',
      'Energy Efficient & Low Power Usage',
      'Free Installation & Express Setup',
    ],
    buttonText: 'Explore Cooling',
    buttonLink: '/products?search=Air%20Conditioners',
    bgImage: '/images/hero-cooling.jpg',
    gradientOverlay: 'linear-gradient(110deg, rgba(13, 148, 136, 0.85) 0%, rgba(15, 118, 110, 0.5) 30%, rgba(15, 23, 42, 0.15) 70%, transparent 100%)',
    accentColor: '#5eead4',
  },
  {
    id: 'slide-3',
    titlePrefix: 'Smart Home Entertainment',
    titleHighlight: '4K Ultra HD Televisions',
    highlights: [
      'Immersive Surround Sound & Vivid Color',
      'Easy No-Cost EMI Options Available',
      'Official Brand Warranty Included',
    ],
    buttonText: 'Discover TVs',
    buttonLink: '/products?search=Televisions',
    bgImage: '/images/hero-tv.jpg',
    gradientOverlay: 'linear-gradient(110deg, rgba(67, 56, 202, 0.85) 0%, rgba(79, 70, 229, 0.5) 30%, rgba(15, 23, 42, 0.15) 70%, transparent 100%)',
    accentColor: '#a78bfa',
  },
];

const AUTO_SLIDE_INTERVAL = 4000;

export function HeroBannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, AUTO_SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }

    setTouchStartX(null);
  };

  const activeSlide = slides[currentSlide];
  const bgStyle = activeSlide.gradientOverlay + ", url('" + activeSlide.bgImage + "')";

  return (
    <section className="container hero-banner-section" style={{ paddingTop: '0.75rem' }}>
      <div
        className="hero-banner-card"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ backgroundImage: bgStyle }}
      >
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="hero-nav-arrow left"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          key={activeSlide.id}
          className="hero-slide-content"
          style={{
            maxWidth: '580px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <h1
            className="hero-banner-title"
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '0.75rem',
              textShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {activeSlide.titlePrefix}
            <br />
            <span style={{ color: activeSlide.accentColor, transition: 'color 0.4s ease' }}>
              {activeSlide.titleHighlight}
            </span>
          </h1>

          <div
            className="hero-banner-highlights"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            {activeSlide.highlights.map((text, idx) => (
              <div
                key={idx}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.95 }}
              >
                <CheckCircle2 size={15} color={activeSlide.accentColor} />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <Link
            href={activeSlide.buttonLink}
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
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <span>{activeSlide.buttonText}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next Slide"
          className="hero-nav-arrow right"
        >
          <ChevronRight size={20} />
        </button>

        <div className="hero-carousel-dots">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            const btnClass = isActive ? 'hero-dot-btn active' : 'hero-dot-btn inactive';
            return (
              <button
                key={slide.id}
                type="button"
                className={btnClass}
                onClick={() => setCurrentSlide(index)}
                aria-label={'Go to slide ' + (index + 1)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
