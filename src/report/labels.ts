import {
  HoldsAir,
  LineCondition,
  PhotoCategory,
  ReadyStatus,
  type DRingConditionValue,
  type Photo,
} from '../models';
import { formatWeightKg } from '../utils/anchors';
import type { PieceOutcome, ReportLayout, ReportPiece } from './types';

export function pieceHeading(piece: ReportPiece['piece']): string {
  return piece.pieceNumber.trim() ? `Piece ${piece.pieceNumber.trim()}` : 'Unnumbered piece';
}

export function serialLabel(piece: ReportPiece['piece']): string {
  return piece.serialNumber.trim() ? `Serial ${piece.serialNumber.trim()}` : 'No serial number';
}

export function holdsAirLabel(value: ReportPiece['piece']['holdsAir']): string {
  if (value === HoldsAir.Yes) {
    return 'Yes';
  }
  if (value === HoldsAir.No) {
    return 'No';
  }
  return 'Not tested';
}

export function readyLabel(value: ReportPiece['piece']['readyStatus']): string {
  if (value === ReadyStatus.Yes) {
    return 'Ready';
  }
  if (value === ReadyStatus.YesIfRepaired) {
    return 'Ready if repaired';
  }
  if (value === ReadyStatus.No) {
    return 'Not ready';
  }
  return 'Not assessed';
}

export function conditionLabel(value: LineCondition | DRingConditionValue): string {
  if (value === LineCondition.Good) {
    return 'Good';
  }
  if (value === LineCondition.Damaged) {
    return 'Damaged';
  }
  return 'Not assessed';
}

export function weightLabel(value: number | null): string {
  const formatted = formatWeightKg(value);
  return formatted ? `${formatted} kg` : '—';
}

export function outcomeLabel(outcome: PieceOutcome): string {
  if (outcome === 'ready') {
    return 'Ready';
  }
  if (outcome === 'repair') {
    return 'Ready if repaired';
  }
  if (outcome === 'unsuitable') {
    return 'Not ready';
  }
  return 'Not assessed';
}

export function photoCaption(photo: Photo): string {
  const caption = photo.caption.trim();
  if (caption) {
    return caption;
  }

  if (photo.category === PhotoCategory.Serial) {
    return 'Serial plate';
  }
  if (photo.category === PhotoCategory.Damage) {
    return 'Damage';
  }
  if (photo.category === PhotoCategory.Anchor) {
    return 'Anchor';
  }
  if (photo.category === PhotoCategory.DRing) {
    return 'D-ring';
  }
  if (photo.category === PhotoCategory.AirPressure) {
    return 'Pressure test';
  }
  if (photo.category === PhotoCategory.Readiness) {
    return 'Readiness';
  }
  return 'Photograph';
}

export function missingValveCoverCountLabel(count: number): string {
  return `Valve covers missing: ${count}`;
}

export function valveCoverMissingLabel(value: ReportPiece['piece']['valveCoverMissing']): string {
  if (value === 'yes') {
    return 'Yes';
  }
  if (value === 'no') {
    return 'No';
  }
  return 'Not assessed';
}

export function layoutTitle(layout: ReportLayout): string {
  if (layout === 'findings') {
    return 'Findings first';
  }
  if (layout === 'sheets') {
    return 'One sheet per piece';
  }
  return 'Classic owner pack';
}

export function layoutDescription(layout: ReportLayout): string {
  if (layout === 'findings') {
    return 'Opens with work to do. Clean pieces stay in an inventory table.';
  }
  if (layout === 'sheets') {
    return 'One page per inflatable, with photos beside the findings.';
  }
  return 'Cover, counts, then a full page for each piece.';
}
