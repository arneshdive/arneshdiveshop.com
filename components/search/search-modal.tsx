'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories?flat=true');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/produk?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-auto mt-[15vh] px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Icon
                icon="solar:magnifer-linear"
                className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari produk..."
                className="w-full pl-14 pr-14 py-5 text-xl border-0 focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <Icon icon="solar:close-circle-linear" className="w-6 h-6 text-neutral-400" />
              </button>
            </div>
          </form>

          {/* Quick Links */}
          <div className="border-t border-neutral-100 px-5 py-4">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Kategori</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/produk?category=${category.slug}`}
                  onClick={onClose}
                  className="px-4 py-2 text-sm bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="border-t border-neutral-100 px-5 py-3 text-center">
            <p className="text-xs text-neutral-400">
              Tekan <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-500">Enter</kbd> untuk mencari atau pilih kategori
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
