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

/**
 * Format Indonesian phone number for display (e.g., "0812-3456-7890")
 * Takes a raw phone number and formats it with dashes for readability.
 */
export function formatPhoneDisplay(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle different formats
  let normalized = digits;
  if (digits.startsWith('62') && digits.length >= 10) {
    normalized = '0' + digits.slice(2);
  }
  
  // Format: 0812-3456-7890 or 0812-3456-789 (for shorter numbers)
  if (normalized.length === 11 || normalized.length === 12) {
    return normalized.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');
  }
  if (normalized.length === 10) {
    return normalized.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3');
  }
  
  // Return as-is if doesn't match expected patterns
  return phone;
}

/**
 * Format phone number as user types (for input fields)
 * Returns a formatted string like "0812-3456-7890"
 */
export function formatPhoneInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  
  // Limit to 13 digits (for numbers like +62...)
  const limited = digits.slice(0, 13);
  
  // Format with dashes as user types
  if (limited.length <= 4) return limited;
  if (limited.length <= 8) return `${limited.slice(0, 4)}-${limited.slice(4)}`;
  return `${limited.slice(0, 4)}-${limited.slice(4, 8)}-${limited.slice(8)}`;
}
