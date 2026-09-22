import { DRingCondition, HoldsAir, ReadyStatus, type Piece } from '../models';

export interface InspectionProgress {
  total: number;
  completed: number;
  notStarted: number;
  inProgress: number;
}

export function isPieceNotStarted(piece: Piece): boolean {
  return (
    !piece.isComplete &&
    piece.pieceNumber.trim() === '' &&
    piece.serialNumber.trim() === '' &&
    piece.holdsAir === HoldsAir.NotTested &&
    piece.connectingDRingCondition === DRingCondition.NotAssessed &&
    piece.readyStatus === ReadyStatus.NotAssessed
  );
}

export function getPieceWorkStatus(
  piece: Piece,
): 'not-started' | 'in-progress' | 'complete' {
  if (piece.isComplete) {
    return 'complete';
  }

  return isPieceNotStarted(piece) ? 'not-started' : 'in-progress';
}

export function calculateInspectionProgress(pieces: Piece[]): InspectionProgress {
  let completed = 0;
  let notStarted = 0;
  let inProgress = 0;

  for (const piece of pieces) {
    const status = getPieceWorkStatus(piece);
    if (status === 'complete') {
      completed += 1;
    } else if (status === 'not-started') {
      notStarted += 1;
    } else {
      inProgress += 1;
    }
  }

  return {
    total: pieces.length,
    completed,
    notStarted,
    inProgress,
  };
}
