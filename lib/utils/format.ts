// For true integer-cents values (per the DB convention in SPEC.md) once a real
// backend exists — divides by 100 before formatting.
export function formatCurrency(cents: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// For today's mock data: every `*Cents`-named mock field actually holds a
// whole-Rupiah amount (no /100), consistent with mock-products.ts's display
// strings. Use this — not formatCurrency — until real cents-based data exists.
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

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
