import { db } from '../db';
import {
  DRingCondition,
  HoldsAir,
  ReadyStatus,
  ValveCoverMissing,
  type Piece,
  type PieceDraft,
  type PieceUpdate,
} from '../models';
import { nowIso } from '../utils/dates';
import { createId } from '../utils/id';
import { nextPieceNumber } from '../utils/pieceNumbers';

export function normalizePiece(record: Piece): Piece {
  return {
    ...record,
    holdsAir: record.holdsAir ?? HoldsAir.NotTested,
    holdsAirNotes: record.holdsAirNotes ?? '',
    connectingDRingCondition: record.connectingDRingCondition ?? DRingCondition.NotAssessed,
    connectingDRingNotes: record.connectingDRingNotes ?? '',
    valveCoverMissing: record.valveCoverMissing ?? ValveCoverMissing.NotAssessed,
    readyStatus: record.readyStatus ?? ReadyStatus.NotAssessed,
    readyNotes: record.readyNotes ?? '',
  };
}

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
    connectingDRingCondition: DRingCondition.NotAssessed,
    connectingDRingNotes: '',
    valveCoverMissing: ValveCoverMissing.NotAssessed,
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

export async function updatePiece(id: string, patch: PieceUpdate): Promise<void> {
  const existing = await db.pieces.get(id);
  if (!existing) {
    throw new Error('Piece not found.');
  }

  const timestamp = nowIso();
  const current = normalizePiece(existing);
  const next: Piece = {
    ...current,
    ...('pieceNumber' in patch && patch.pieceNumber !== undefined
      ? { pieceNumber: patch.pieceNumber.trim() }
      : {}),
    ...('serialNumber' in patch && patch.serialNumber !== undefined
      ? { serialNumber: patch.serialNumber.trim() }
      : {}),
    ...('holdsAir' in patch && patch.holdsAir !== undefined ? { holdsAir: patch.holdsAir } : {}),
    ...('holdsAirNotes' in patch && patch.holdsAirNotes !== undefined
      ? { holdsAirNotes: patch.holdsAirNotes }
      : {}),
    ...('connectingDRingCondition' in patch && patch.connectingDRingCondition !== undefined
      ? { connectingDRingCondition: patch.connectingDRingCondition }
      : {}),
    ...('connectingDRingNotes' in patch && patch.connectingDRingNotes !== undefined
      ? { connectingDRingNotes: patch.connectingDRingNotes }
      : {}),
    ...('valveCoverMissing' in patch && patch.valveCoverMissing !== undefined
      ? { valveCoverMissing: patch.valveCoverMissing }
      : {}),
    ...('readyStatus' in patch && patch.readyStatus !== undefined
      ? { readyStatus: patch.readyStatus }
      : {}),
    ...('readyNotes' in patch && patch.readyNotes !== undefined
      ? { readyNotes: patch.readyNotes }
      : {}),
    updatedAt: timestamp,
  };

  await db.transaction('rw', db.pieces, db.inspections, async () => {
    await db.pieces.put(next);
    await db.inspections.update(existing.inspectionId, { updatedAt: timestamp });
  });
}

export async function deletePiece(id: string): Promise<void> {
  const existing = await db.pieces.get(id);
  if (!existing) {
    return;
  }

  const timestamp = nowIso();

  await db.transaction(
    'rw',
    db.pieces,
    db.anchors,
    db.dRings,
    db.photos,
    db.inspections,
    async () => {
      await db.photos.where('pieceId').equals(id).delete();
      await db.anchors.where('pieceId').equals(id).delete();
      await db.dRings.where('pieceId').equals(id).delete();
      await db.pieces.delete(id);
      await db.inspections.update(existing.inspectionId, { updatedAt: timestamp });
    },
  );
}

export async function getPiece(id: string): Promise<Piece | undefined> {
  const piece = await db.pieces.get(id);
  return piece ? normalizePiece(piece) : undefined;
}

export async function listPieces(inspectionId: string): Promise<Piece[]> {
  const pieces = await db.pieces.where('inspectionId').equals(inspectionId).toArray();
  return pieces
    .map(normalizePiece)
    .sort((a, b) => a.pieceNumber.localeCompare(b.pieceNumber, undefined, { numeric: true }));
}
