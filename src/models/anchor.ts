import type { LineCondition } from './enums';

/**
 * Structure fields (anchorNumber, weightKg) are distinct from inspection
 * results (lineCondition, lineNotes) so a later "copy structure" action can
 * clone layout without copying condition findings.
 */
export interface Anchor {
  id: string;
  pieceId: string;
  anchorNumber: string;
  weightKg: number | null;
  lineCondition: LineCondition;
  lineNotes: string;
  createdAt: string;
  updatedAt: string;
}
