import type { DRingCondition, HoldsAir, ReadyStatus, ValveCoverMissing } from './enums';

export interface Piece {
  id: string;
  inspectionId: string;
  pieceNumber: string;
  serialNumber: string;
  holdsAir: HoldsAir;
  holdsAirNotes: string;
  connectingDRingCondition: DRingCondition;
  connectingDRingNotes: string;
  valveCoverMissing: ValveCoverMissing;
  readyStatus: ReadyStatus;
  readyNotes: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PieceDraft = Pick<Piece, 'pieceNumber' | 'serialNumber'>;

export type PieceUpdate = Partial<
  Pick<
    Piece,
    | 'pieceNumber'
    | 'serialNumber'
    | 'holdsAir'
    | 'holdsAirNotes'
    | 'connectingDRingCondition'
    | 'connectingDRingNotes'
    | 'valveCoverMissing'
    | 'readyStatus'
    | 'readyNotes'
  >
>;
