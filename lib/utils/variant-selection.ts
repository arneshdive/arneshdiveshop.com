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
 * Group active variant option values by their option name (dimension),
 * preserving insertion order and deduplicating across variants.
 *
 * e.g. for stiffness × size variants this yields
 *   [{ name: 'stiffness', values: ['Soft', 'Medium'] },
 *    { name: 'size', values: ['39-41', '42-44'] }]
 */
export function getVariantOptionGroups(
  variants: SelectableVariant[],
): VariantOptionGroup[] {
  const groups: VariantOptionGroup[] = [];
  const seenNames = new Set<string>();

  for (const variant of variants) {
    if (!variant.isActive) continue;

    for (const [name, value] of Object.entries(variant.options)) {
      if (!value) continue;

      let group = groups.find((g) => g.name === name);
      if (!group) {
        group = { name, values: [] };
        groups.push(group);
        seenNames.add(name);
      }

      if (!group.values.includes(value)) {
        group.values.push(value);
      }
    }
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
