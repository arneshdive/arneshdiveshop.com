'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

interface Destination {
  id: string;
  name: string;
  type: string;
  province: string;
  city?: string;
  district?: string;
  fullName: string;
}

interface DestinationSearchProps {
  value?: string; // Current destination name
  onSelect: (destination: Destination) => void;
  placeholder?: string;
  className?: string;
}

export function DestinationSearch({ value, onSelect, placeholder = 'Cari kelurahan atau kecamatan...', className }: DestinationSearchProps) {
  const [search, setSearch] = useState(value || '');
  const [results, setResults] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search destinations
  useEffect(() => {
    if (!search.trim() || search.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/shipping/cities?search=${encodeURIComponent(search)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.cities || []);
        }
      } catch (error) {
        console.error('Error searching destinations:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (destination: Destination) => {
    setSearch(destination.fullName);
    setIsOpen(false);
    setResults([]);
    onSelect(destination);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-10 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors ${className || ''}`}
        />
        {isLoading && (
          <Icon icon="solar:spinner" className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-neutral-400" />
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map((destination) => (
            <button
              key={destination.id}
              type="button"
              onClick={() => handleSelect(destination)}
              className="w-full px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
            >
              <p className="text-sm font-medium text-neutral-900">{destination.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{destination.fullName}</p>
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isOpen && isLoading && search.length >= 3 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Icon icon="solar:spinner" className="w-4 h-4 animate-spin" />
            Mencari...
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && search.length >= 3 && results.length === 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg p-4">
          <p className="text-sm text-neutral-500">Tidak ada hasil ditemukan</p>
        </div>
      )}
    </div>
  );
}
