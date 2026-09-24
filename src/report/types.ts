import type { Anchor, Inspection, Photo, Piece } from '../models';

export const ReportLayout = {
  Classic: 'classic',
  Findings: 'findings',
  Sheets: 'sheets',
} as const;

export type ReportLayout = (typeof ReportLayout)[keyof typeof ReportLayout];

export type PieceOutcome = 'ready' | 'repair' | 'unsuitable' | 'unassessed';

export interface ReportPiece {
  piece: Piece;
  anchors: Anchor[];
  photos: Photo[];
}

export interface ReportSummary {
  total: number;
  ready: number;
  repair: number;
  unsuitable: number;
  unassessed: number;
  missingValveCovers: number;
}

export interface InspectionReport {
  inspection: Inspection;
  pieces: ReportPiece[];
  summary: ReportSummary;
}
