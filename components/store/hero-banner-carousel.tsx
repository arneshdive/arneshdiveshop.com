'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  
  // Use fallback if no banners from DB
  const displayBanners = banners.length > 0 ? banners : [fallbackBanner as Banner];
  
  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollProgress = -rect.top / rect.height;
      setParallaxOffset(scrollProgress * 150); // Adjust multiplier for parallax intensity
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
    <section ref={sectionRef} className="relative min-h-[650px] lg:min-h-[740px] overflow-hidden">
      {/* Background Image with Parallax */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ transform: `translateY(${parallaxOffset}px) scale(1.1)` }}
      >
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
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col items-center justify-center text-center min-h-[650px] lg:min-h-[740px]">
            <div className={`transition-all duration-300 ${
              isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}>
              {currentBanner.eyebrow && (
                <span className="inline-block text-xs uppercase tracking-widest text-white/70 mb-4">
                  {currentBanner.eyebrow}
                </span>
              )}
              <h1 className="text-4xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tighter whitespace-pre-line">
                {currentBanner.title || 'Berjelajah di kedalaman'}
              </h1>
              {currentBanner.subtitle && (
                <p className="text-white/80 text-lg mb-8 max-w-md leading-relaxed mx-auto">
                  {currentBanner.subtitle}
                </p>
              )}
              <div className="flex flex-wrap gap-3 justify-center">
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
