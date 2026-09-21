import type { DRingCondition, LineCondition } from './enums';

/**
 * Structure fields (anchorNumber, weightKg) are distinct from inspection
 * results so a later "copy structure" action can clone layout without copying
 * condition findings. Connecting D-ring condition lives on the anchor for V1.
 */
export interface Anchor {
  id: string;
  pieceId: string;
  anchorNumber: string;
  weightKg: number | null;
  lineCondition: LineCondition;
  lineNotes: string;
  connectingDRingCondition: DRingCondition;
  connectingDRingNotes: string;
  createdAt: string;
  updatedAt: string;
}

export type AnchorDraft = Pick<
  Anchor,
  | 'anchorNumber'
  | 'weightKg'
  | 'lineCondition'
  | 'lineNotes'
  | 'connectingDRingCondition'
  | 'connectingDRingNotes'
>;
