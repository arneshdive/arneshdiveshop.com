export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Indonesian mobile: 08xxxxxxxxxx or +62 8xxxxxxxxx
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

export function isValidPostalCode(code: string): boolean {
  return /^\d{5}$/.test(code);
}
