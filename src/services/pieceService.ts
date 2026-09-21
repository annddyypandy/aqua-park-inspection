import { db } from '../db';
import { HoldsAir, ReadyStatus, type Piece, type PieceDraft } from '../models';
import { nowIso } from '../utils/dates';
import { createId } from '../utils/id';
import { nextPieceNumber } from '../utils/pieceNumbers';

function defaultPieceFields(
  inspectionId: string,
  draft: PieceDraft,
  timestamp: string,
): Piece {
  return {
    id: createId(),
    inspectionId,
    pieceNumber: draft.pieceNumber.trim(),
    serialNumber: draft.serialNumber.trim(),
    holdsAir: HoldsAir.NotTested,
    holdsAirNotes: '',
    readyStatus: ReadyStatus.NotAssessed,
    readyNotes: '',
    isComplete: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function suggestNextPieceNumber(inspectionId: string): Promise<string> {
  const pieces = await db.pieces.where('inspectionId').equals(inspectionId).toArray();
  return nextPieceNumber(pieces.map((piece) => piece.pieceNumber));
}

export async function createPiece(
  inspectionId: string,
  draft: PieceDraft,
): Promise<Piece> {
  const inspection = await db.inspections.get(inspectionId);
  if (!inspection) {
    throw new Error('Inspection not found.');
  }

  const timestamp = nowIso();
  const piece = defaultPieceFields(inspectionId, draft, timestamp);

  await db.transaction('rw', db.pieces, db.inspections, async () => {
    await db.pieces.add(piece);
    await db.inspections.update(inspectionId, { updatedAt: timestamp });
  });

  return piece;
}

export async function updatePiece(
  id: string,
  patch: Partial<PieceDraft>,
): Promise<void> {
  const existing = await db.pieces.get(id);
  if (!existing) {
    throw new Error('Piece not found.');
  }

  const timestamp = nowIso();
  const next: Piece = {
    ...existing,
    ...('pieceNumber' in patch && patch.pieceNumber !== undefined
      ? { pieceNumber: patch.pieceNumber.trim() }
      : {}),
    ...('serialNumber' in patch && patch.serialNumber !== undefined
      ? { serialNumber: patch.serialNumber.trim() }
      : {}),
    updatedAt: timestamp,
  };

  await db.transaction('rw', db.pieces, db.inspections, async () => {
    await db.pieces.put(next);
    await db.inspections.update(existing.inspectionId, { updatedAt: timestamp });
  });
}

export async function getPiece(id: string): Promise<Piece | undefined> {
  return db.pieces.get(id);
}

export async function listPieces(inspectionId: string): Promise<Piece[]> {
  const pieces = await db.pieces.where('inspectionId').equals(inspectionId).toArray();
  return pieces.sort((a, b) => a.pieceNumber.localeCompare(b.pieceNumber, undefined, { numeric: true }));
}
