import { describe, it, expect } from 'vitest';
import { isDuplicateAddress } from './is-duplicate-address';

describe('isDuplicateAddress', () => {
  const saved = {
    address1: 'Jl. Kemang Raya No. 10',
    rajaongkirCityId: '154',
    phone: '081234567890',
  };

  it('returns false when the customer has no saved addresses', () => {
    expect(isDuplicateAddress([], saved)).toBe(false);
  });

  it('returns true for an exact match', () => {
    expect(isDuplicateAddress([saved], saved)).toBe(true);
  });

  it('ignores case and surrounding whitespace in address1', () => {
    const candidate = { ...saved, address1: '  jl. kemang raya no. 10  ' };
    expect(isDuplicateAddress([saved], candidate)).toBe(true);
  });

  it('returns false when the street address differs', () => {
    const candidate = { ...saved, address1: 'Jl. Sudirman No. 1' };
    expect(isDuplicateAddress([saved], candidate)).toBe(false);
  });

  it('returns false when the rajaongkir destination differs', () => {
    const candidate = { ...saved, rajaongkirCityId: '999' };
    expect(isDuplicateAddress([saved], candidate)).toBe(false);
  });

  it('returns false when the recipient phone differs', () => {
    const candidate = { ...saved, phone: '089999999999' };
    expect(isDuplicateAddress([saved], candidate)).toBe(false);
  });

  it('treats null and empty-string phone as equal', () => {
    const candidate = { ...saved, phone: null };
    expect(isDuplicateAddress([{ ...saved, phone: '' }], candidate)).toBe(true);
  });
});
