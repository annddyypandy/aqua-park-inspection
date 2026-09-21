import { describe, expect, it } from 'vitest';
import { nextAnchorNumber, parseWeightKg } from './anchors';

describe('parseWeightKg', () => {
  it('treats a blank field as no weight', () => {
    expect(parseWeightKg('')).toBeNull();
    expect(parseWeightKg('  ')).toBeNull();
  });

  it('accepts decimals and comma decimals', () => {
    expect(parseWeightKg('12.5')).toBe(12.5);
    expect(parseWeightKg('12,5')).toBe(12.5);
  });

  it('rejects negative or non-numeric values', () => {
    expect(() => parseWeightKg('-1')).toThrow();
    expect(() => parseWeightKg('heavy')).toThrow();
  });
});

describe('nextAnchorNumber', () => {
  it('starts at 1', () => {
    expect(nextAnchorNumber([])).toBe('1');
  });

  it('increments from the highest number', () => {
    expect(nextAnchorNumber(['1', '3'])).toBe('4');
  });
});
