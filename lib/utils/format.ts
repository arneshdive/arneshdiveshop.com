/**
 * Format cents to Rupiah currency string.
 * 
 * CONVENTION: All prices in the database are stored as cents (1 Rupiah = 100 cents).
 * - Rp 850.000 is stored as 85000000 in the database
 * - This function divides by 100 to convert cents to Rupiah for display
 * 
 * @param cents - Amount in cents (e.g., 85000000 for Rp 850.000)
 * @returns Formatted currency string (e.g., "Rp850.000")
 */
export function formatRupiah(cents: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// Alias for clarity in some contexts
export const formatCurrency = formatRupiah;

// Formats a raw numeric input value with thousands separators as the user types
// (e.g. admin form fields for price). Distinct from formatRupiah/formatCurrency,
// which render a finalized amount for read-only display.
export function formatCurrencyInput(value: string | number): string {
  const digits = typeof value === 'string' ? value.replace(/\D/g, '') : String(value);
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('id-ID');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(d);
}
