import { db } from '../db';
import type { Inspection, InspectionDraft } from '../models';
import { createId } from '../utils/id';
import { nowIso } from '../utils/dates';

export async function createInspection(draft: InspectionDraft): Promise<Inspection> {
  const timestamp = nowIso();
  const inspection: Inspection = {
    id: createId(),
    name: draft.name.trim(),
    siteName: draft.siteName.trim(),
    inspectionDate: draft.inspectionDate,
    inspectorName: draft.inspectorName.trim(),
    notes: draft.notes.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.inspections.add(inspection);
  return inspection;
}

export async function updateInspection(
  id: string,
  patch: Partial<InspectionDraft>,
): Promise<void> {
  const existing = await db.inspections.get(id);
  if (!existing) {
    throw new Error('Inspection not found.');
  }

  const next: Inspection = {
    ...existing,
    ...('name' in patch && patch.name !== undefined
      ? { name: patch.name.trim() }
      : {}),
    ...('siteName' in patch && patch.siteName !== undefined
      ? { siteName: patch.siteName.trim() }
      : {}),
    ...('inspectionDate' in patch && patch.inspectionDate !== undefined
      ? { inspectionDate: patch.inspectionDate }
      : {}),
    ...('inspectorName' in patch && patch.inspectorName !== undefined
      ? { inspectorName: patch.inspectorName.trim() }
      : {}),
    ...('notes' in patch && patch.notes !== undefined
      ? { notes: patch.notes }
      : {}),
    updatedAt: nowIso(),
  };

  await db.inspections.put(next);
}

export async function getInspection(id: string): Promise<Inspection | undefined> {
  return db.inspections.get(id);
}

export async function listInspections(): Promise<Inspection[]> {
  return db.inspections.orderBy('updatedAt').reverse().toArray();
}

export async function deleteInspection(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.inspections,
    db.pieces,
    db.anchors,
    db.dRings,
    db.photos,
    async () => {
      const pieceIds = await db.pieces.where('inspectionId').equals(id).primaryKeys();
      await db.inspections.delete(id);
      await db.pieces.where('inspectionId').equals(id).delete();

      if (pieceIds.length === 0) {
        return;
      }

      await db.anchors.where('pieceId').anyOf(pieceIds).delete();
      await db.dRings.where('pieceId').anyOf(pieceIds).delete();
      await db.photos.where('pieceId').anyOf(pieceIds).delete();
    },
  );
}
