type UmamiEventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: UmamiEventData) => void;
    };
  }
}

// No-ops when the Umami script hasn't loaded (blocked, still loading, or
// dev mode where app/layout.tsx doesn't render it at all).
export function track(eventName: string, data?: UmamiEventData) {
  if (typeof window === 'undefined') return;
  window.umami?.track(eventName, data);
}
