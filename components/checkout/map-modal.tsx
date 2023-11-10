'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useCheckoutStore } from '@/lib/store/checkout';
import { provinces } from '@/lib/constants/provinces';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect?: (address: {
    address1: string;
    city: string;
    postalCode: string;
    state: string;
    formattedAddress?: string;
    lat: number;
    lng: number;
  }) => void;
}

interface AddressComponents {
  street?: string;
  city?: string;
  postalCode?: string;
  province?: string;
}

const DEFAULT_CENTER = { lat: -6.2088, lng: 106.8456 }; // Jakarta
const DEFAULT_ZOOM = 12;
const INDONESIA_BOUNDS = {
  north: 6.0,
  south: -11.0,
  west: 95.0,
  east: 141.0,
};

function MapContent({
  onLocationSelect,
  initialAddress,
}: {
  onLocationSelect: (address: AddressComponents, lat: number, lng: number) => void;
  initialAddress?: string;
}) {
  const map = useMap();
  const geocoding = useMapsLibrary('geocoding');
  const places = useMapsLibrary('places');
  
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_CENTER);
  const [searchInput, setSearchInput] = useState(initialAddress || '');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize autocomplete
  useEffect(() => {
    if (!places || !map) return;

    const autocompleteInstance = new places.Autocomplete(
      document.getElementById('map-search-input') as HTMLInputElement,
      {
        componentRestrictions: { country: 'id' },
        bounds: new google.maps.LatLngBounds(
          { lat: INDONESIA_BOUNDS.south, lng: INDONESIA_BOUNDS.west },
          { lat: INDONESIA_BOUNDS.north, lng: INDONESIA_BOUNDS.east }
        ),
        fields: ['geometry', 'formatted_address', 'address_components'],
      }
    );

    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarkerPosition({ lat, lng });
        map.setCenter({ lat, lng });
        map.setZoom(16);
        setSearchInput(place.formatted_address || '');
      }
    });
  }, [places, map]);

  // Handle marker drag
  const handleMarkerDrag = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  // Reverse geocode on marker drop
  const handleMarkerDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!geocoding || !e.latLng) return;

    const geocoder = new geocoding.Geocoder();
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        setSearchInput(response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, [geocoding]);

  // Parse address components
  const parseAddressComponents = (addressComponents: google.maps.GeocoderAddressComponent[]): AddressComponents => {
    const result: AddressComponents = {};
    
    for (const component of addressComponents) {
      const types = component.types;
      
      if (types.includes('route') || types.includes('street_address')) {
        result.street = component.long_name;
      }
      if (types.includes('sublocality') || types.includes('administrative_area_level_3')) {
        if (!result.street) {
          result.street = component.long_name;
        }
      }
      if (types.includes('administrative_area_level_2')) {
        result.city = component.long_name;
      }
      if (types.includes('postal_code')) {
        result.postalCode = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        result.province = component.long_name;
      }
    }
    
    return result;
  };

  // Handle confirm location
  const handleConfirm = useCallback(async () => {
    if (!geocoding) return;

    setIsLoading(true);
    const geocoder = new geocoding.Geocoder();

    try {
      const response = await geocoder.geocode({ location: markerPosition });
      if (response.results[0]) {
        const addressComponents = parseAddressComponents(response.results[0].address_components);
        
        // Try to match province with our list
        if (addressComponents.province) {
          const matchedProvince = provinces.find(
            p => p.toLowerCase().includes(addressComponents.province!.toLowerCase()) ||
                 addressComponents.province!.toLowerCase().includes(p.toLowerCase())
          );
          if (matchedProvince) {
            addressComponents.province = matchedProvince;
          }
        }

        onLocationSelect(addressComponents, markerPosition.lat, markerPosition.lng);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [geocoding, markerPosition, onLocationSelect]);

  // Handle map click - uses the library's MapMouseEvent type
  const handleMapClick = useCallback((event: { detail: { latLng: { lat: number; lng: number } | null } }) => {
    const latLng = event.detail.latLng;
    if (latLng) {
      setMarkerPosition({
        lat: latLng.lat,
        lng: latLng.lng,
      });
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-neutral-200">
        <div className="relative">
          <Icon icon="solar:magnifer-linear" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            id="map-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari alamat..."
            className="w-full pl-12 pr-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-neutral-900 focus:outline-none transition-colors"
          />
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          Ketik alamat atau geser pin di peta untuk menentukan lokasi
        </p>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          mapId="arnesh-map"
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          onClick={handleMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker
            position={markerPosition}
            draggable
            onDrag={handleMarkerDrag}
            onDragEnd={handleMarkerDragEnd}
          >
            <div className="relative">
              <Icon icon="solar:map-point-bold" className="w-10 h-10 text-neutral-900 drop-shadow-lg" />
            </div>
          </AdvancedMarker>
        </Map>
      </div>

      {/* Confirm Button */}
      <div className="p-4 bg-white border-t border-neutral-200">
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full py-4 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Memproses...' : 'Konfirmasi Lokasi'}
        </button>
      </div>
    </div>
  );
}

export function MapModal({ isOpen, onClose, onAddressSelect }: MapModalProps) {
  const { data, setField } = useCheckoutStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocationSelect = useCallback(
    (address: AddressComponents, lat: number, lng: number) => {
      // Build formatted address for display
      const parts: string[] = [];
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      if (address.postalCode) parts.push(address.postalCode);
      if (address.province) parts.push(address.province);
      
      const formattedAddress = parts.join(', ');

      // If callback provided, use it (for address management)
      if (onAddressSelect) {
        onAddressSelect({
          address1: address.street || '',
          city: address.city || '',
          postalCode: address.postalCode || '',
          state: address.province || '',
          formattedAddress,
          lat,
          lng,
        });
      } else {
        // Default: update checkout store
        setField('address1', address.street || '');
        setField('city', address.city || '');
        setField('postalCode', address.postalCode || '');
        setField('province', address.province || '');
        setField('hasMapLocation', true);
        setField('formattedAddress', formattedAddress);
        setField('lat', lat);
        setField('lng', lng);
      }
      onClose();
    },
    [setField, onClose, onAddressSelect]
  );

  if (!mounted || !isOpen) return null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key not found');
    return null;
  }

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
          <h3 className="text-lg font-semibold">Pilih Lokasi</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <Icon icon="solar:close-circle-linear" className="w-6 h-6 text-neutral-500" />
          </button>
        </div>

        {/* Map Content */}
        <APIProvider apiKey={apiKey} libraries={['geocoding', 'places']}>
          <div className="flex-1 overflow-hidden">
            <MapContent
              onLocationSelect={handleLocationSelect}
              initialAddress={data.address1}
            />
          </div>
        </APIProvider>
      </div>
    </div>,
    document.body
  );
}
