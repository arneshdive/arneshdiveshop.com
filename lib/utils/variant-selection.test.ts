import { describe, it, expect } from 'vitest';
import { getVariantOptionGroups, findMatchingVariant } from './variant-selection';
import type { SelectableVariant } from './variant-selection';

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
