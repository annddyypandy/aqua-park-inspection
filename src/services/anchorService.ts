import { db } from '../db';
import {
  DRingCondition,
  LineCondition,
  type Anchor,
  type AnchorDraft,
} from '../models';
import { nextAnchorNumber } from '../utils/anchors';
import { nowIso } from '../utils/dates';
import { createId } from '../utils/id';

export function normalizeAnchor(record: Anchor): Anchor {
  return {
    ...record,
    weightKg: record.weightKg ?? null,
    lineCondition: record.lineCondition ?? LineCondition.NotAssessed,
    lineNotes: record.lineNotes ?? '',
    connectingDRingCondition: record.connectingDRingCondition ?? DRingCondition.NotAssessed,
    connectingDRingNotes: record.connectingDRingNotes ?? '',
  };
}

async function stampPiece(pieceId: string): Promise<void> {
  const piece = await db.pieces.get(pieceId);
  if (!piece) {
    throw new Error('Piece not found.');
  }

  const timestamp = nowIso();
  await db.pieces.update(pieceId, { updatedAt: timestamp });
  await db.inspections.update(piece.inspectionId, { updatedAt: timestamp });
}

export async function listAnchors(pieceId: string): Promise<Anchor[]> {
  const anchors = await db.anchors.where('pieceId').equals(pieceId).toArray();
  return anchors
    .map(normalizeAnchor)
    .sort((a, b) => a.anchorNumber.localeCompare(b.anchorNumber, undefined, { numeric: true }));
}

export async function addAnchor(pieceId: string): Promise<Anchor> {
  const piece = await db.pieces.get(pieceId);
  if (!piece) {
    throw new Error('Piece not found.');
  }

  const timestamp = nowIso();
  const existing = await db.anchors.where('pieceId').equals(pieceId).toArray();
  const anchor: Anchor = {
    id: createId(),
    pieceId,
    anchorNumber: nextAnchorNumber(existing.map((item) => item.anchorNumber)),
    weightKg: null,
    lineCondition: LineCondition.NotAssessed,
    lineNotes: '',
    connectingDRingCondition: DRingCondition.NotAssessed,
    connectingDRingNotes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.transaction('rw', db.anchors, db.pieces, db.inspections, async () => {
    await db.anchors.add(anchor);
    await stampPiece(pieceId);
  });

  return anchor;
}

export async function updateAnchor(id: string, patch: Partial<AnchorDraft>): Promise<void> {
  const existing = await db.anchors.get(id);
  if (!existing) {
    throw new Error('Anchor not found.');
  }

  const current = normalizeAnchor(existing);
  const timestamp = nowIso();
  const next: Anchor = {
    ...current,
    ...patch,
    ...(patch.anchorNumber !== undefined ? { anchorNumber: patch.anchorNumber.trim() } : {}),
    ...(patch.lineNotes !== undefined ? { lineNotes: patch.lineNotes } : {}),
    ...(patch.connectingDRingNotes !== undefined
      ? { connectingDRingNotes: patch.connectingDRingNotes }
      : {}),
    updatedAt: timestamp,
  };

  await db.transaction('rw', db.anchors, db.pieces, db.inspections, async () => {
    await db.anchors.put(next);
    await stampPiece(existing.pieceId);
  });
}

export async function deleteAnchor(id: string): Promise<void> {
  const existing = await db.anchors.get(id);
  if (!existing) {
    return;
  }

  await db.transaction('rw', db.anchors, db.photos, db.pieces, db.inspections, async () => {
    await db.photos.where('parentId').equals(id).delete();
    await db.anchors.delete(id);
    await stampPiece(existing.pieceId);
  });
}
