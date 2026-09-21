import { describe, expect, it } from 'vitest';
import { nextPieceNumber } from './pieceNumbers';

describe('nextPieceNumber', () => {
  it('starts at 001', () => {
    expect(nextPieceNumber([])).toBe('001');
  });

  it('increments from the highest numeric value', () => {
    expect(nextPieceNumber(['001', '010', '2'])).toBe('011');
  });
});
