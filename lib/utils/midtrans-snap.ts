/**
 * Midtrans Snap.js integration helper
 * 
 * Usage:
 * 1. Call loadSnapScript() to load the Snap.js script
 * 2. Wait for isSnapLoaded() to return true
 * 3. Call openSnapPayment(snapToken, callbacks) to open payment popup
 */

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: SnapResult) => void;
          onPending?: (result: SnapResult) => void;
          onError?: (result: SnapError) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export interface SnapResult {
  order_id: string;
  status_code: string;
  transaction_status: string;
  payment_type: string;
  gross_amount: string;
  transaction_time: string;
  [key: string]: unknown;
}

export interface SnapError {
  status_code: string;
  status_message: string;
  [key: string]: unknown;
}

const SNAP_SCRIPT_ID = 'midtrans-snap-script';

/**
 * Get the appropriate Snap.js URL based on environment
 */
function getSnapUrl(): string {
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
  return isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}

/**
 * Get the Midtrans client key
 */
function getClientKey(): string {
  return process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
}

/**
 * Check if Snap.js script is loaded
 */
export function isSnapLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.snap !== 'undefined';
}

/**
 * Load the Midtrans Snap.js script
 * Returns a promise that resolves when the script is loaded
 */
export function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (isSnapLoaded()) {
      resolve();
      return;
    }

    // Check if script tag already exists but hasn't loaded yet
    const existingScript = document.getElementById(SNAP_SCRIPT_ID);
    if (existingScript) {
      // Wait for existing script to load
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Snap.js')));
      return;
    }

    // Create and append script
    const script = document.createElement('script');
    script.id = SNAP_SCRIPT_ID;
    script.src = getSnapUrl();
    script.setAttribute('data-client-key', getClientKey());
    script.async = true;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Midtrans Snap.js'));
    };

    document.body.appendChild(script);
  });
}

/**
 * Open the Midtrans Snap payment popup
 */
export function openSnapPayment(
  snapToken: string,
  callbacks: {
    onSuccess?: (result: SnapResult) => void;
    onPending?: (result: SnapResult) => void;
    onError?: (error: SnapError) => void;
    onClose?: () => void;
  }
): void {
  if (!isSnapLoaded()) {
    console.error('Snap.js is not loaded. Call loadSnapScript() first.');
    return;
  }

  if (!window.snap) {
    console.error('Snap.js is not available on window.');
    return;
  }

  window.snap.pay(snapToken, {
    onSuccess: callbacks.onSuccess,
    onPending: callbacks.onPending,
    onError: callbacks.onError,
    onClose: callbacks.onClose,
  });
}
