import type { DivingType } from '@/lib/db/schema';

export const DIVING_TYPES: DivingType[] = [
  'freediving',
  'scuba',
  'spearfishing',
  'surfing',
  'swimming',
];

export const DIVING_TYPE_OPTIONS = DIVING_TYPES.map((type) => ({
  id: type,
  name: formatDivingType(type),
}));

export function formatDivingType(type: DivingType): string {
  const labels: Record<DivingType, string> = {
    freediving: 'Freediving',
    scuba: 'Scuba',
    spearfishing: 'Spearfishing',
    surfing: 'Surfing',
    swimming: 'Swimming',
  };
  return labels[type];
}
