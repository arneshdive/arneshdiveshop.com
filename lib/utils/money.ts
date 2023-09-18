/**
 * ALL money is stored as INTEGER CENTS in the database.
 *
 * Why: Floating-point math is imprecise (0.1 + 0.2 !== 0.3)
 * PostgreSQL DECIMAL would work, but integers are simpler and faster.
 *
 * Convention:
 * - DB column: priceCents (integer)
 * - API response: priceDollars (number, converted at boundary)
 * - Display: formatCurrency(priceCents)
 */

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
