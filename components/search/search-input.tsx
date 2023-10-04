'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils/cn';

interface SearchInputProps {
  initialValue?: string;
  className?: string;
}

export function SearchInput({ initialValue = '', className }: SearchInputProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || initialValue;
  const [query, setQuery] = useState(initialQuery);
  const [isSticky, setIsSticky] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      // Start sticking after scrolling past 100px (approx half of banner)
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('q', query.trim());
      // Reset filters when submitting new search
      params.delete('category');
      params.delete('priceMin');
      params.delete('priceMax');
      params.delete('brands');
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 z-30',
        isSticky
          ? 'fixed top-[72px] left-0 right-0 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm'
          : 'bg-neutral-50',
        className
      )}
    >
      <div className="max-w-[1440px] mx-auto px-4 lg:px-12 py-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative">
          <Icon
            icon="solar:magnifer-linear"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-12 pr-10 py-3 text-lg border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Hapus pencarian"
            >
              <Icon icon="solar:close-circle-linear" className="w-5 h-5 text-neutral-400" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
