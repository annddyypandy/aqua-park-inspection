import { DRingCondition, HoldsAir, LineCondition, ReadyStatus } from '../models';
import { pieceHeading } from './labels';
import type { PieceOutcome, ReportPiece, ReportSummary } from './types';

export function hasDamagedAnchor(entry: ReportPiece): boolean {
  return entry.anchors.some(
    (anchor) =>
      anchor.lineCondition === LineCondition.Damaged ||
      anchor.connectingDRingCondition === DRingCondition.Damaged,
  );
}

export function classifyPiece(entry: ReportPiece): PieceOutcome {
  const { piece } = entry;
  if (piece.readyStatus === ReadyStatus.No || piece.holdsAir === HoldsAir.No) {
    return 'unsuitable';
  }
  if (piece.readyStatus === ReadyStatus.YesIfRepaired || hasDamagedAnchor(entry)) {
    return 'repair';
  }
  if (piece.readyStatus === ReadyStatus.Yes) {
    return 'ready';
  }
  return 'unassessed';
}

export function summarizePieces(pieces: ReportPiece[]): ReportSummary {
  const summary: ReportSummary = {
    total: pieces.length,
    ready: 0,
    repair: 0,
    unsuitable: 0,
    unassessed: 0,
  };

  for (const entry of pieces) {
    summary[classifyPiece(entry)] += 1;
  }

  return summary;
}

export function pieceFlags(entry: ReportPiece): string[] {
  const flags: string[] = [];
  if (entry.piece.holdsAir === HoldsAir.No) {
    flags.push('Pressure');
  }
  if (entry.anchors.some((anchor) => anchor.lineCondition === LineCondition.Damaged)) {
    flags.push('Line');
  }
  if (
    entry.anchors.some((anchor) => anchor.connectingDRingCondition === DRingCondition.Damaged)
  ) {
    flags.push('D-ring');
  }
  return flags;
}

export function findingReasons(entry: ReportPiece): string[] {
  const reasons: string[] = [];
  const { piece } = entry;

  if (piece.holdsAir === HoldsAir.No) {
    reasons.push(
      piece.holdsAirNotes.trim()
        ? `Failed pressure test. ${piece.holdsAirNotes.trim()}`
        : 'Failed pressure test.',
    );
  }

  for (const anchor of entry.anchors) {
    if (anchor.lineCondition === LineCondition.Damaged) {
      reasons.push(
        anchor.lineNotes.trim()
          ? `Anchor ${anchor.anchorNumber} line damaged. ${anchor.lineNotes.trim()}`
          : `Anchor ${anchor.anchorNumber} line damaged.`,
      );
    }
    if (anchor.connectingDRingCondition === DRingCondition.Damaged) {
      reasons.push(
        anchor.connectingDRingNotes.trim()
          ? `Anchor ${anchor.anchorNumber} connecting D-ring damaged. ${anchor.connectingDRingNotes.trim()}`
          : `Anchor ${anchor.anchorNumber} connecting D-ring damaged.`,
      );
    }
  }

  if (piece.readyStatus === ReadyStatus.YesIfRepaired && piece.readyNotes.trim()) {
    reasons.push(piece.readyNotes.trim());
  } else if (piece.readyStatus === ReadyStatus.No && piece.readyNotes.trim()) {
    reasons.push(piece.readyNotes.trim());
  }

  if (reasons.length === 0 && piece.readyStatus === ReadyStatus.No) {
    reasons.push('Not ready for next season.');
  }

  return reasons;
}

export function attentionItems(pieces: ReportPiece[]): string[] {
  return pieces
    .filter((entry) => classifyPiece(entry) === 'unsuitable' || classifyPiece(entry) === 'repair')
    .map((entry) => {
      const reasons = findingReasons(entry);
      const detail = reasons[0] ?? outcomeFallback(entry);
      return `${pieceHeading(entry.piece)} — ${detail}`;
    });
}

function outcomeFallback(entry: ReportPiece): string {
  const outcome = classifyPiece(entry);
  if (outcome === 'unsuitable') {
    return 'Not ready for use.';
  }
  return 'Ready if repaired.';
}
