import { DRingCondition, type DRingConditionValue } from '../models';

interface LegacyAnchorDRing {
  connectingDRingCondition?: string;
  connectingDRingNotes?: string;
}

/**
 * Collapse per-anchor connecting D-ring answers onto one piece value.
 * Damaged wins; otherwise any Good becomes Good; otherwise not assessed.
 */
export function foldConnectingDRingFromAnchors(anchors: LegacyAnchorDRing[]): {
  connectingDRingCondition: DRingConditionValue;
  connectingDRingNotes: string;
} {
  let damaged = false;
  let good = false;
  const notes: string[] = [];

  for (const anchor of anchors) {
    if (anchor.connectingDRingCondition === DRingCondition.Damaged) {
      damaged = true;
    } else if (anchor.connectingDRingCondition === DRingCondition.Good) {
      good = true;
    }

    const note = anchor.connectingDRingNotes?.trim() ?? '';
    if (note) {
      notes.push(note);
    }
  }

  return {
    connectingDRingCondition: damaged
      ? DRingCondition.Damaged
      : good
        ? DRingCondition.Good
        : DRingCondition.NotAssessed,
    connectingDRingNotes: notes.join(' '),
  };
}
