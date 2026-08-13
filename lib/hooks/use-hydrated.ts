'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first client render (hydration), then
 * `true` on subsequent client renders.
 *
 * Use as a hydration guard to avoid rendering content that depends on
 * browser-only APIs (localStorage, Leaflet, persisted cart state) until the
 * client has hydrated. This replaces the common
 * `useEffect(() => setMounted(true), [])` pattern without a setState-in-effect.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
