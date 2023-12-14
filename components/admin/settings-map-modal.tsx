'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface SettingsMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: {
    addressFormatted: string;
    addressLat: string;
    addressLng: string;
  }) => void;
  initialLat?: string;
  initialLng?: string;
  initialAddress?: string;
}

const DEFAULT_CENTER_LAT = -6.2088;
const DEFAULT_CENTER_LNG = 106.8456; // Jakarta
const DEFAULT_ZOOM = 12;

// Component to handle map events and marker dragging
function MapController({
  position,
  setPosition,
  onReverseGeocode,
}: {
  position: L.LatLng;
  setPosition: (pos: L.LatLng) => void;
  onReverseGeocode: (lat: number, lng: number) => Promise<void>;
}) {
  const map = useMap();

  // Handle map click
  useMapEvents({
    click: async (e) => {
      setPosition(e.latlng);
      await onReverseGeocode(e.latlng.lat, e.latlng.lng);
    },
  });

  // Move map when position changes
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);

  return null;
}

// Nominatim geocoding functions
async function searchAddress(query: string): Promise<{ lat: number; lon: number; display_name: string }[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=5`
  );
  return response.json();
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  );
  const data = await response.json();
  return data.display_name || '';
}

function MapContent({
  position,
  setPosition,
  setAddressInput,
}: {
  position: L.LatLng;
  setPosition: (pos: L.LatLng) => void;
  setAddressInput: (address: string) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<{ lat: number; lon: number; display_name: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reverse geocode handler
  const handleReverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const address = await reverseGeocode(lat, lng);
      setSearchInput(address);
      setAddressInput(address);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setAddressInput]);

  // Handle search
  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchAddress(searchInput);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search result selection
  const handleSelectResult = (result: { lat: number; lon: number; display_name: string }) => {
    const newPos = L.latLng(result.lat, result.lon);
    setPosition(newPos);
    setSearchInput(result.display_name);
    setAddressInput(result.display_name);
    setSearchResults([]);
  };

  // Handle marker drag
  const handleMarkerDrag = async (e: L.DragEndEvent) => {
    const newPos = e.target.getLatLng();
    setPosition(newPos);
    await handleReverseGeocode(newPos.lat, newPos.lng);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-neutral-200 relative">
        <div className="relative">
          <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Cari alamat..."
            className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-neutral-400">
            Ketik alamat atau klik di peta untuk menentukan lokasi
          </p>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchInput.trim()}
            className="text-xs text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
          >
            {isSearching ? 'Mencari...' : 'Cari'}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-[1000] max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
              >
                <p className="text-neutral-900 line-clamp-2">{result.display_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[DEFAULT_CENTER_LAT, DEFAULT_CENTER_LNG]}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            icon={markerIcon}
            draggable
            eventHandlers={{ dragend: handleMarkerDrag }}
          />
          <MapController
            position={position}
            setPosition={setPosition}
            onReverseGeocode={handleReverseGeocode}
          />
        </MapContainer>
        
        {isLoading && (
          <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow text-xs text-neutral-600">
            Memproses...
          </div>
        )}
      </div>

      {/* Confirm Button */}
      <div className="p-4 bg-white border-t border-neutral-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-neutral-500">Koordinat:</span>
          <span className="text-xs text-neutral-900 font-mono">
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SettingsMapModal({
  isOpen,
  onClose,
  onAddressSelect,
  initialLat,
  initialLng,
  initialAddress,
}: SettingsMapModalProps) {
  const [mounted, setMounted] = useState(false);
  const [addressInput, setAddressInput] = useState(initialAddress || '');
  
  // Initialize position from props or default
  const [position, setPosition] = useState<L.LatLng>(() => {
    if (initialLat && initialLng) {
      return L.latLng(parseFloat(initialLat), parseFloat(initialLng));
    }
    return L.latLng(DEFAULT_CENTER_LAT, DEFAULT_CENTER_LNG);
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset position when modal opens with new initial values
  useEffect(() => {
    if (isOpen && initialLat && initialLng) {
      setPosition(L.latLng(parseFloat(initialLat), parseFloat(initialLng)));
    }
    if (isOpen && initialAddress) {
      setAddressInput(initialAddress);
    }
  }, [isOpen, initialLat, initialLng, initialAddress]);

  const handleConfirm = () => {
    onAddressSelect({
      addressFormatted: addressInput,
      addressLat: position.lat.toString(),
      addressLng: position.lng.toString(),
    });
    onClose();
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full h-full sm:w-[600px] sm:h-[80vh] sm:max-h-[700px] sm:rounded-2xl bg-white overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-neutral-200 flex-shrink-0">
          <h3 className="text-lg font-semibold">Pilih Lokasi Toko</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Icon icon="solar:close-circle-linear" className="w-6 h-6 text-neutral-500" />
          </button>
        </div>

        {/* Map Content */}
        <div className="flex-1 overflow-hidden">
          <MapContent
            position={position}
            setPosition={setPosition}
            setAddressInput={setAddressInput}
          />
        </div>

        {/* Footer with confirm button */}
        <div className="p-4 bg-white border-t border-neutral-200 flex-shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Konfirmasi Lokasi
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
