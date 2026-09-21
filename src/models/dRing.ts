import type { DRingCondition } from './enums';

export interface DRing {
  id: string;
  pieceId: string;
  dRingNumber: string;
  condition: DRingCondition;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
