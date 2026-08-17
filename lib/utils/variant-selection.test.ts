import { describe, it, expect } from 'vitest';
import { getVariantOptionGroups, findMatchingVariant } from './variant-selection';
import type { SelectableVariant, VariantOptionDefinition } from './variant-selection';

// Mirrors the seeded "Beuchat Mundial Carbon Fins" (stiffness × size)
const fins: SelectableVariant[] = [
  { id: 'v1', name: 'Soft / 39-41', options: { stiffness: 'Soft', size: '39-41' }, priceCents: 450000000, isActive: true },
  { id: 'v2', name: 'Medium / 39-41', options: { stiffness: 'Medium', size: '39-41' }, priceCents: 450000000, isActive: true },
  { id: 'v3', name: 'Medium / 42-44', options: { stiffness: 'Medium', size: '42-44' }, priceCents: 470000000, isActive: true },
];

describe('getVariantOptionGroups', () => {
  it('returns distinct values grouped by option name from active variants', () => {
    const groups = getVariantOptionGroups(fins);

    expect(groups.map((g) => g.name)).toEqual(['stiffness', 'size']);
    const stiffness = groups.find((g) => g.name === 'stiffness');
    const size = groups.find((g) => g.name === 'size');

    expect(stiffness?.values).toEqual(['Soft', 'Medium']);
    expect(size?.values).toEqual(['39-41', '42-44']);
  });

  it('excludes values that only appear on inactive variants', () => {
    const variants: SelectableVariant[] = [
      { id: 'v1', name: 'A', options: { color: 'Red' }, priceCents: null, isActive: true },
      { id: 'v2', name: 'B', options: { color: 'Blue' }, priceCents: null, isActive: false },
    ];

    const groups = getVariantOptionGroups(variants);
    expect(groups[0]?.values).toEqual(['Red']);
  });

  it('returns empty array when there are no variants', () => {
    expect(getVariantOptionGroups([])).toEqual([]);
  });
});

describe('getVariantOptionGroups with variantOptions ordering', () => {
  it('orders groups and values according to variantOptions', () => {
    const ordered: VariantOptionDefinition[] = [
      { name: 'size', values: ['42-44', '39-41'] },
      { name: 'stiffness', values: ['Medium', 'Soft'] },
    ];

    const groups = getVariantOptionGroups(fins, ordered);

    expect(groups.map((g) => g.name)).toEqual(['size', 'stiffness']);
    expect(groups[0]?.values).toEqual(['42-44', '39-41']);
    expect(groups[1]?.values).toEqual(['Medium', 'Soft']);
  });

  it('drops values from variantOptions that are not present in active variants', () => {
    const ordered: VariantOptionDefinition[] = [
      { name: 'size', values: ['999-999', '39-41'] },
    ];

    const size = getVariantOptionGroups(fins, ordered).find((g) => g.name === 'size');

    expect(size?.values).toEqual(['39-41', '42-44']);
  });

  it('drops dimensions from variantOptions that have no active variants', () => {
    const ordered: VariantOptionDefinition[] = [
      { name: 'color', values: ['Red'] },
      { name: 'size', values: ['39-41'] },
    ];

    const groups = getVariantOptionGroups(fins, ordered);

    expect(groups.map((g) => g.name)).toEqual(['size', 'stiffness']);
  });

  it('appends active dimensions and values not listed in variantOptions', () => {
    const ordered: VariantOptionDefinition[] = [
      { name: 'size', values: ['39-41'] },
    ];

    const groups = getVariantOptionGroups(fins, ordered);

    expect(groups.map((g) => g.name)).toEqual(['size', 'stiffness']);
    expect(groups[0]?.values).toEqual(['39-41', '42-44']);
    expect(groups[1]?.values).toEqual(['Soft', 'Medium']);
  });

  it('still excludes values that only appear on inactive variants when ordering is provided', () => {
    const variants: SelectableVariant[] = [
      { id: 'v1', name: 'A', options: { color: 'Red' }, priceCents: null, isActive: true },
      { id: 'v2', name: 'B', options: { color: 'Blue' }, priceCents: null, isActive: false },
    ];
    const ordered: VariantOptionDefinition[] = [
      { name: 'color', values: ['Blue', 'Red'] },
    ];

    const groups = getVariantOptionGroups(variants, ordered);

    expect(groups[0]?.values).toEqual(['Red']);
  });

  it('falls back to first-appearance order when variantOptions is empty or undefined', () => {
    expect(getVariantOptionGroups(fins, undefined).map((g) => g.name)).toEqual(['stiffness', 'size']);
    expect(getVariantOptionGroups(fins, []).map((g) => g.name)).toEqual(['stiffness', 'size']);
  });
});

describe('findMatchingVariant', () => {
  it('matches a single-dimension selection', () => {
    const variants: SelectableVariant[] = [
      { id: 's', name: 'S', options: { size: 'S' }, priceCents: null, isActive: true },
      { id: 'm', name: 'M', options: { size: 'M' }, priceCents: null, isActive: true },
    ];

    expect(findMatchingVariant(variants, { size: 'M' })?.id).toBe('m');
  });

  it('matches the exact variant when combining selections across dimensions', () => {
    // The regression: picking size then stiffness must resolve to the
    // single variant whose FULL option combination matches both choices.
    expect(findMatchingVariant(fins, { stiffness: 'Medium', size: '42-44' })?.id).toBe('v3');
    expect(findMatchingVariant(fins, { stiffness: 'Medium', size: '39-41' })?.id).toBe('v2');
    expect(findMatchingVariant(fins, { stiffness: 'Soft', size: '39-41' })?.id).toBe('v1');
  });

  it('matches regardless of key insertion order', () => {
    const a = findMatchingVariant(fins, { size: '42-44', stiffness: 'Medium' });
    const b = findMatchingVariant(fins, { stiffness: 'Medium', size: '42-44' });
    expect(a?.id).toBe('v3');
    expect(b?.id).toBe('v3');
  });

  it('returns undefined when no variant matches the full combination', () => {
    // "Soft / 42-44" is not offered in the seed data.
    expect(findMatchingVariant(fins, { stiffness: 'Soft', size: '42-44' })).toBeUndefined();
  });

  it('does not match inactive variants', () => {
    const variants: SelectableVariant[] = [
      { id: 'v1', name: 'A', options: { color: 'Red' }, priceCents: null, isActive: false },
    ];
    expect(findMatchingVariant(variants, { color: 'Red' })).toBeUndefined();
  });
});
