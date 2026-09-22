import { db } from '../db';
import { normalizeAnchor } from './anchorService';
import { listPieces } from './pieceService';
import { summarizePieces } from '../report/summary';
import type { InspectionReport, ReportPiece } from '../report/types';

export async function loadInspectionReport(
  inspectionId: string,
): Promise<InspectionReport | null> {
  const inspection = await db.inspections.get(inspectionId);
  if (!inspection) {
    return null;
  }

  const pieces = await listPieces(inspectionId);
  const pieceIds = pieces.map((piece) => piece.id);
  const [anchors, photos] = pieceIds.length
    ? await Promise.all([
        db.anchors.where('pieceId').anyOf(pieceIds).toArray(),
        db.photos.where('pieceId').anyOf(pieceIds).toArray(),
      ])
    : [[], []];

  const reportPieces: ReportPiece[] = pieces.map((piece) => ({
    piece,
    anchors: anchors
      .filter((anchor) => anchor.pieceId === piece.id)
      .map(normalizeAnchor)
      .sort((a, b) =>
        a.anchorNumber.localeCompare(b.anchorNumber, undefined, { numeric: true }),
      ),
    photos: photos
      .filter((photo) => photo.pieceId === piece.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }));

  return {
    inspection,
    pieces: reportPieces,
    summary: summarizePieces(reportPieces),
  };
}
