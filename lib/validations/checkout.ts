import { z } from 'zod';
import { isValidEmail, isValidPhone } from '@/lib/utils/validators';

// Every rule is a `.refine()` (not `.min()`/`.email()`) so each failure
// carries a stable `params.i18nKey` — the schema only decides *which* rule
// failed, the actual message always comes from next-intl's `checkout.*`
// messages (already translated into all 5 locales) via that key, looked up
// with `getFieldI18nKey` below. Parsed against the full CheckoutData object
// from lib/store/checkout.ts; unlisted fields (address2, notes,
// shippingMethod, ...) are ignored by z.object()'s default parsing.
export const checkoutFormSchema = z.object({
  email: z
    .string()
    .refine((v) => v.trim().length > 0, { params: { i18nKey: 'contact.emailRequired' } })
    .refine((v) => isValidEmail(v), { params: { i18nKey: 'contact.emailInvalid' } }),
  phone: z
    .string()
    .refine((v) => v.trim().length > 0, { params: { i18nKey: 'contact.phoneRequired' } })
    .refine((v) => isValidPhone(v), { params: { i18nKey: 'contact.phoneInvalid' } }),
  fullName: z
    .string()
    .refine((v) => v.trim().length > 0, { params: { i18nKey: 'shipping.fullNameRequired' } }),
  rajaongkirCityId: z
    .string()
    .nullable()
    .refine((v) => !!v, { params: { i18nKey: 'shipping.destinationRequired' } }),
  address1: z
    .string()
    .refine((v) => v.trim().length > 0, { params: { i18nKey: 'shipping.address1Required' } }),
});

export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
type CheckoutFormResult = ReturnType<typeof checkoutFormSchema.safeParse>;

// The i18n key (relative to the "checkout" namespace, e.g. "contact.emailRequired")
// for the first failing rule on a given field, or undefined if it currently passes.
export function getFieldI18nKey(
  result: CheckoutFormResult,
  field: keyof CheckoutFormInput
): string | undefined {
  if (result.success) return undefined;
  const issue = result.error.issues.find((i) => i.path[0] === field);
  // Every issue in this schema comes from a `.refine()` (a custom check),
  // which does carry `params` at runtime — the general $ZodIssue union type
  // just doesn't expose it on every variant, hence the cast.
  return (issue as { params?: Record<string, unknown> } | undefined)?.params?.i18nKey as
    | string
    | undefined;
}
