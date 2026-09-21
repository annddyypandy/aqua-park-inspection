import type { HoldsAir, ReadyStatus } from './enums';

export interface Piece {
  id: string;
  inspectionId: string;
  pieceNumber: string;
  serialNumber: string;
  holdsAir: HoldsAir;
  holdsAirNotes: string;
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
    | 'readyStatus'
    | 'readyNotes'
  >
>;
