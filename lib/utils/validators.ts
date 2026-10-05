export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Indonesian mobile: 08xxxxxxxxxx or +62 8xxxxxxxxx
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/** Checkout keeps Indonesian mobile rules locally and accepts overseas numbers
 * without changing their calling code. Formatting characters are ignored. */
export function normalizeCheckoutPhone(phone: string, countryCode: string): string {
  const compact = phone.trim().replace(/[\s().-]/g, '');
  if (countryCode !== 'ID') return compact;

  let digits = compact.replace(/^\+/, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  if (!digits.startsWith('62')) digits = `62${digits}`;
  return digits;
}

export function isValidCheckoutPhone(phone: string, countryCode: string): boolean {
  const normalized = normalizeCheckoutPhone(phone, countryCode);
  return countryCode === 'ID'
    ? isValidPhone(normalized)
    : /^\+?\d{7,15}$/.test(normalized);
}

export function isValidPostalCode(code: string): boolean {
  return /^\d{5}$/.test(code);
}
