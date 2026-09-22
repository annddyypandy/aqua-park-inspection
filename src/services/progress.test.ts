import { describe, expect, it } from 'vitest';
import { DRingCondition, HoldsAir, ReadyStatus, type Piece } from '../models';
import { calculateInspectionProgress, getPieceWorkStatus } from './progress';

function piece(overrides: Partial<Piece>): Piece {
  return {
    id: 'piece-1',
    inspectionId: 'inspection-1',
    pieceNumber: '',
    serialNumber: '',
    holdsAir: HoldsAir.NotTested,
    holdsAirNotes: '',
    connectingDRingCondition: DRingCondition.NotAssessed,
    connectingDRingNotes: '',
    readyStatus: ReadyStatus.NotAssessed,
    readyNotes: '',
    isComplete: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('inspection progress', () => {
  it('counts empty default pieces as not started', () => {
    const pieces = [piece({ id: 'a' }), piece({ id: 'b' })];
    expect(calculateInspectionProgress(pieces)).toEqual({
      total: 2,
      completed: 0,
      notStarted: 2,
      inProgress: 0,
    });
  });

  it('treats a numbered piece as in progress', () => {
    const result = getPieceWorkStatus(piece({ pieceNumber: '001' }));
    expect(result).toBe('in-progress');
  });

  it('counts completed pieces independently of remaining work', () => {
    const pieces = [
      piece({ id: 'a', isComplete: true, pieceNumber: '001' }),
      piece({ id: 'b', pieceNumber: '002' }),
      piece({ id: 'c' }),
    ];

    expect(calculateInspectionProgress(pieces)).toEqual({
      total: 3,
      completed: 1,
      notStarted: 1,
      inProgress: 1,
    });
  });
});
