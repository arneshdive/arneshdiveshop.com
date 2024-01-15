'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { WaveDivider } from '@/components/layout/wave-divider';
import type { Banner } from '@/lib/db/schema';

interface HeroBannerCarouselProps {
  banners: Banner[];
}

// Fallback banner when no banners from DB
const fallbackBanner = {
  id: 'fallback',
  title: 'Berjelajah di kedalaman',
  subtitle: 'Temukan perlengkapan freediving yang Anda butuhkan.',
  eyebrow: 'Freediving & Scuba',
  ctaText: 'Semua Katalog',
  ctaLink: '/produk',
  imageUrl: '/hero-image.webp',
};

export function HeroBannerCarousel({ banners }: HeroBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Use fallback if no banners from DB
  const displayBanners = banners.length > 0 ? banners : [fallbackBanner as Banner];
  
  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (displayBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [displayBanners.length]);
  
  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  }, [currentIndex]);
  
  const currentBanner = displayBanners[currentIndex];
  
  if (!currentBanner) {
    return null;
  }
  
  return (
    <section className="relative min-h-[650px] lg:min-h-[740px]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.title || 'Hero'}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 min-h-[650px] lg:min-h-[740px] items-center gap-8 lg:gap-12">
            <div className={`py-12 lg:py-0 transition-all duration-300 ${
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}>
              {currentBanner.eyebrow && (
                <span className="inline-block text-xs uppercase tracking-widest text-white/70 mb-4">
                  {currentBanner.eyebrow}
                </span>
              )}
              <h1 className="text-4xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tighter">
                {currentBanner.title || 'Berjelajah di kedalaman'}
              </h1>
              {currentBanner.subtitle && (
                <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed">
                  {currentBanner.subtitle}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <AnimatedButton
                  asChild
                  variant="white"
                >
                  <Link href={currentBanner.ctaLink || currentBanner.link || '/produk'}>
                    {currentBanner.ctaText || 'Lihat Koleksi'}
                  </Link>
                </AnimatedButton>
              </div>
            </div>
            <div className="hidden lg:block" />
          </div>
        </div>
      </div>

      {/* Carousel Indicators */}
      {displayBanners.length > 1 && (
        <div className="absolute bottom-24 lg:bottom-28 left-0 right-0 z-20 flex justify-center gap-2">
          {displayBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <WaveDivider className="z-20" />
    </section>
  );
}
