# Shop Settings with Map Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded shop settings with database-backed settings and a Leaflet/OSM-based map picker for store location.

**Architecture:** Single-row `shop_settings` table stores all shop configuration. Admin settings page loads from and saves to API. New Leaflet-based map modal replaces Google Maps for address selection.

**Tech Stack:** Drizzle ORM, Leaflet, react-leaflet, OpenStreetMap, Nominatim geocoding API

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `lib/db/schema.ts` | Modify | Add `shop_settings` table |
| `app/api/admin/settings/route.ts` | Create | GET/PUT API for settings |
| `app/admin/settings/page.tsx` | Rewrite | Load from DB, remove payment/shipping |
| `components/admin/settings-map-modal.tsx` | Create | Leaflet map picker component |

---

## Task 1: Add shop_settings Table to Schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add shop_settings table definition**

Add after the `banners` table definition, before the Relations section:

```typescript
// ============================================================================
// Shop Settings
// ============================================================================

export const shopSettings = pgTable('shop_settings', {
  id: text('id').primaryKey().default('default'),
  // Shop info
  storeName: text('store_name').notNull().default("Arne's Dive Shop"),
  email: text('email').notNull().default('support@arnesdive.com'),
  phone: text('phone').notNull().default('+62 812-3456-7890'),
  whatsapp: text('whatsapp').notNull().default('6281234567890'),
  businessHours: text('business_hours').notNull().default('Senin – Jumat: 09:00 – 17:00 WIB'),
  about: text('about'),
  // Address (from map picker)
  addressFormatted: text('address_formatted'),
  addressLat: text('address_lat'),
  addressLng: text('address_lng'),
  // Social media
  instagram: text('instagram'),
  tiktok: text('tiktok'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ShopSettings = typeof shopSettings.$inferSelect;
export type NewShopSettings = typeof shopSettings.$inferInsert;
```

- [ ] **Step 2: Push schema changes to database**

Run:
```bash
pnpm db:push
```

Expected: Schema pushed successfully with new `shop_settings` table.

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add shop_settings table for store configuration"
```

---

## Task 2: Install Leaflet Dependencies

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install Leaflet packages**

Run:
```bash
pnpm add leaflet react-leaflet
pnpm add -D @types/leaflet
```

Expected: Packages installed successfully.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add leaflet and react-leaflet for map picker"
```

---

## Task 3: Create Settings API Route

**Files:**
- Create: `app/api/admin/settings/route.ts`

- [ ] **Step 1: Create API route file**

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shopSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/settings - Fetch shop settings
export async function GET() {
  try {
    let settings = await db
      .select()
      .from(shopSettings)
      .where(eq(shopSettings.id, 'default'))
      .limit(1);

    // Create default settings if none exist
    if (settings.length === 0) {
      const [newSettings] = await db
        .insert(shopSettings)
        .values({ id: 'default' })
        .returning();
      settings = [newSettings];
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching shop settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Update shop settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const [updated] = await db
      .update(shopSettings)
      .set({
        storeName: body.storeName,
        email: body.email,
        phone: body.phone,
        whatsapp: body.whatsapp,
        businessHours: body.businessHours,
        about: body.about,
        addressFormatted: body.addressFormatted,
        addressLat: body.addressLat,
        addressLng: body.addressLng,
        instagram: body.instagram,
        tiktok: body.tiktok,
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.id, 'default'))
      .returning();

    if (!updated) {
      // Create if doesn't exist
      const [created] = await db
        .insert(shopSettings)
        .values({
          id: 'default',
          ...body,
        })
        .returning();
      return NextResponse.json(created);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating shop settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/settings/route.ts
git commit -m "feat: add GET/PUT API for shop settings"
```

---

## Task 4: Create Leaflet Map Modal Component

**Files:**
- Create: `components/admin/settings-map-modal.tsx`

- [ ] **Step 1: Create the map modal component**

```typescript
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

const DEFAULT_CENTER: L.LatLngExpression = [-6.2088, 106.8456]; // Jakarta
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
          center={position}
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
    return L.latLng(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
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
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/settings-map-modal.tsx
git commit -m "feat: add Leaflet-based map picker for shop settings"
```

---

## Task 5: Rewrite Settings Page

**Files:**
- Rewrite: `app/admin/settings/page.tsx`

- [ ] **Step 1: Rewrite the settings page**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Input, Textarea } from '@/components/admin/input';
import { SettingsMapModal } from '@/components/admin/settings-map-modal';

interface ShopSettingsData {
  storeName: string;
  email: string;
  phone: string;
  whatsapp: string;
  businessHours: string;
  about: string;
  addressFormatted: string | null;
  addressLat: string | null;
  addressLng: string | null;
  instagram: string | null;
  tiktok: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettingsData>({
    storeName: '',
    email: '',
    phone: '',
    whatsapp: '',
    businessHours: '',
    about: '',
    addressFormatted: null,
    addressLat: null,
    addressLng: null,
    instagram: null,
    tiktok: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            storeName: data.storeName || '',
            email: data.email || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || '',
            businessHours: data.businessHours || '',
            about: data.about || '',
            addressFormatted: data.addressFormatted || null,
            addressLat: data.addressLat || null,
            addressLng: data.addressLng || null,
            instagram: data.instagram || '',
            tiktok: data.tiktok || '',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        // Show success feedback
        const button = document.querySelector('button[type="submit"]');
        if (button) {
          button.textContent = 'Tersimpan!';
          setTimeout(() => {
            button.textContent = 'Simpan';
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressSelect = (address: {
    addressFormatted: string;
    addressLat: string;
    addressLng: string;
  }) => {
    setSettings(prev => ({
      ...prev,
      addressFormatted: address.addressFormatted,
      addressLat: address.addressLat,
      addressLng: address.addressLng,
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl flex items-center justify-center min-h-[400px]">
        <Icon icon="solar:spinner" className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pengaturan</h1>
          <p className="text-sm text-neutral-500 mt-1">Kelola informasi toko dan preferensi</p>
        </div>
        <AnimatedButton type="submit" form="settings-form" size="xs" disabled={isSaving}>
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </AnimatedButton>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="space-y-6">
        {/* Shop Information */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-base font-medium tracking-tight text-neutral-900">Informasi Toko</h2>

          <Input
            label="Nama toko"
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            placeholder="Nama toko Anda"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="email@tokoanda.com"
            />
            <Input
              label="Telepon"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="+62 xxx-xxxx-xxxx"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="WhatsApp (tanpa +)"
              value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              placeholder="6281234567890"
            />
            <Input
              label="Jam operasional"
              value={settings.businessHours}
              onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
              placeholder="Senin – Jumat: 09:00 – 17:00 WIB"
            />
          </div>

          {/* Address with Map Picker */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Alamat Toko
            </label>
            
            {settings.addressFormatted ? (
              <div className="space-y-3">
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                      <Icon icon="solar:map-point-bold" className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-relaxed">
                        {settings.addressFormatted}
                      </p>
                      {settings.addressLat && settings.addressLng && (
                        <p className="text-xs text-neutral-400 mt-1 font-mono">
                          {parseFloat(settings.addressLat).toFixed(6)}, {parseFloat(settings.addressLng).toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <Icon icon="solar:pen-linear" className="w-4 h-4" />
                  Ubah Lokasi
                </button>
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-neutral-200 rounded-xl">
                <div className="w-12 h-12 mx-auto mb-3 bg-neutral-100 rounded-full flex items-center justify-center">
                  <Icon icon="solar:map-point-linear" className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500 mb-3">
                  Tentukan lokasi toko Anda di peta
                </p>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  <Icon icon="solar:map-point-linear" className="w-5 h-5" />
                  Pilih di Peta
                </button>
              </div>
            )}
          </div>

          <Textarea
            label="Tentang toko"
            value={settings.about || ''}
            onChange={(e) => setSettings({ ...settings, about: e.target.value })}
            placeholder="Deskripsi singkat tentang toko Anda"
            rows={3}
          />
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <h2 className="text-base font-medium tracking-tight text-neutral-900">Media Sosial</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Instagram"
              value={settings.instagram || ''}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              placeholder="username (tanpa @)"
            />
            <Input
              label="TikTok"
              value={settings.tiktok || ''}
              onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
              placeholder="username (tanpa @)"
            />
          </div>
        </div>
      </form>

      {/* Map Modal */}
      <SettingsMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onAddressSelect={handleAddressSelect}
        initialLat={settings.addressLat || undefined}
        initialLng={settings.addressLng || undefined}
        initialAddress={settings.addressFormatted || undefined}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/settings/page.tsx
git commit -m "feat: rewrite settings page with DB persistence and map picker"
```

---

## Task 6: Remove Google Maps Dependency (Optional Cleanup)

**Files:**
- Modify: `package.json` (optional)

- [ ] **Step 1: Remove unused Google Maps packages if no longer needed**

Check if `@vis.gl/react-google-maps` is used elsewhere:
```bash
grep -r "@vis.gl/react-google-maps" --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next"
```

If only used in checkout map modal, but checkout still needs it, skip this step.

If removing:
```bash
pnpm remove @vis.gl/react-google-maps
```

- [ ] **Step 2: Commit (if changes made)**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove unused Google Maps packages"
```

---

## Task 7: Test and Verify

- [ ] **Step 1: Run development server**

```bash
pnpm dev
```

- [ ] **Step 2: Verify functionality**

1. Navigate to `http://localhost:3000/admin/settings`
2. Verify settings load from database
3. Test map picker - search for an address, click on map, drag marker
4. Save settings and verify persistence
5. Refresh page and confirm data persists

- [ ] **Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve any issues from testing"
```
