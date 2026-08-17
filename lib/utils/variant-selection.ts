export interface SelectableVariant {
  id: string;
  name: string;
  options: Record<string, string>;
  priceCents: number | null;
  isActive: boolean;
}

export interface VariantOptionGroup {
  name: string;
  values: string[];
}

/**
 * Persisted definition of a variant option dimension and the ordered list of
 * values within it. Stored on the product so the admin-controlled order
 * (dimension order + value order) survives JSONB key reordering.
 */
export interface VariantOptionDefinition {
  name: string;
  values: string[];
}

/**
 * Group active variant option values by their option name (dimension),
 * deduplicating across variants.
 *
 * When `variantOptions` is provided, it is the source of truth for ordering:
 *   - groups are emitted in the order the dimensions appear in variantOptions
 *   - values are emitted in the order they appear in each dimension's list
 * Active dimensions/values not present in variantOptions are appended in
 * first-appearance order, so legacy products (null variantOptions) still work.
 *
 * e.g. for stiffness × size variants this yields
 *   [{ name: 'stiffness', values: ['Soft', 'Medium'] },
 *    { name: 'size', values: ['39-41', '42-44'] }]
 */
export function getVariantOptionGroups(
  variants: SelectableVariant[],
  variantOptions?: VariantOptionDefinition[],
): VariantOptionGroup[] {
  // Gather the set of values available per dimension from ACTIVE variants only,
  // in first-appearance order. This is the fallback ordering and the source of
  // truth for which values actually exist.
  const available = new Map<string, string[]>();
  for (const variant of variants) {
    if (!variant.isActive) continue;

    for (const [name, value] of Object.entries(variant.options)) {
      if (!value) continue;

      const values = available.get(name) ?? [];
      if (!values.includes(value)) values.push(value);
      available.set(name, values);
    }
  }

  const groups: VariantOptionGroup[] = [];
  const emittedNames = new Set<string>();

  const emit = (name: string, orderedValues: string[]) => {
    if (emittedNames.has(name)) return;
    const availableValues = available.get(name) ?? [];
    if (availableValues.length === 0) return;

    // Start from the admin-ordered values, but only keep those that actually
    // exist on active variants, preserving the admin's relative order.
    const ordered = orderedValues.filter((v) => availableValues.includes(v));
    // Append any active values the admin list didn't mention.
    const rest = availableValues.filter((v) => !ordered.includes(v));

    groups.push({ name, values: [...ordered, ...rest] });
    emittedNames.add(name);
  };

  if (variantOptions && variantOptions.length > 0) {
    for (const option of variantOptions) {
      emit(option.name, option.values);
    }
  }

  // Append any active dimensions not covered by variantOptions (or all of them
  // when no ordering was provided), in first-appearance order.
  for (const name of available.keys()) {
    emit(name, []);
  }

  return groups;
}

/**
 * Find the single active variant whose FULL options object matches the
 * selected values across every dimension.
 *
 * A variant matches only when, for every option name it declares, the
 * selected value is equal. Selections that span multiple dimensions
 * (e.g. stiffness + size) resolve to the one variant that combines them.
 */
export function findMatchingVariant(
  variants: SelectableVariant[],
  selected: Record<string, string>,
): SelectableVariant | undefined {
  return variants.find((variant) => {
    if (!variant.isActive) return false;

    const optionNames = Object.keys(variant.options);
    // Ignore empty selections for an option, but only a variant with no
    // options (or all matching) qualifies.
    return optionNames.every(
      (name) => selected[name] === variant.options[name],
    );
  });
}
