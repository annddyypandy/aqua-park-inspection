import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { createInspection, deleteInspection, updateInspection } from './inspectionService';
import { createPiece, deletePiece, listPieces, suggestNextPieceNumber, updatePiece } from './pieceService';
import { piecePhotoTarget, saveProcessedPhoto } from './photoService';

describe('inspection and piece persistence', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.close();
  });

  it('creates an inspection and restores pieces after reopen-like reads', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex',
      notes: 'End of season',
    });

    await createPiece(inspection.id, { pieceNumber: '001', serialNumber: 'SN-1' });
    await createPiece(inspection.id, { pieceNumber: '002', serialNumber: '' });

    const storedInspection = await db.inspections.get(inspection.id);
    const pieces = await listPieces(inspection.id);

    expect(storedInspection?.name).toBe('Winter 2026');
    expect(pieces).toHaveLength(2);
    expect(pieces[0]?.serialNumber).toBe('SN-1');
  });

  it('suggests the next numeric piece number', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex',
      notes: '',
    });

    await createPiece(inspection.id, { pieceNumber: '001', serialNumber: '' });
    await createPiece(inspection.id, { pieceNumber: '003', serialNumber: '' });

    await expect(suggestNextPieceNumber(inspection.id)).resolves.toBe('004');
  });

  it('updates inspection and piece fields in place', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex',
      notes: '',
    });
    const piece = await createPiece(inspection.id, {
      pieceNumber: '001',
      serialNumber: '',
    });

    await updateInspection(inspection.id, { notes: 'Wind picked up' });
    await updatePiece(piece.id, { serialNumber: 'ABC-9' });

    const storedInspection = await db.inspections.get(inspection.id);
    const storedPiece = await db.pieces.get(piece.id);

    expect(storedInspection?.notes).toBe('Wind picked up');
    expect(storedPiece?.serialNumber).toBe('ABC-9');
  });

  it('deletes an inspection and its pieces together', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex',
      notes: '',
    });
    await createPiece(inspection.id, { pieceNumber: '001', serialNumber: '' });

    await deleteInspection(inspection.id);

    await expect(db.inspections.get(inspection.id)).resolves.toBeUndefined();
    await expect(listPieces(inspection.id)).resolves.toEqual([]);
  });

  it('removes a piece and its photographs without deleting the inspection', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex',
      notes: '',
    });
    const keep = await createPiece(inspection.id, { pieceNumber: '001', serialNumber: '' });
    const remove = await createPiece(inspection.id, { pieceNumber: '002', serialNumber: '' });
    await saveProcessedPhoto(
      piecePhotoTarget(remove.id),
      new Blob(['photo'], { type: 'image/jpeg' }),
    );

    await deletePiece(remove.id);

    await expect(listPieces(inspection.id)).resolves.toEqual([
      expect.objectContaining({ id: keep.id }),
    ]);
    await expect(db.photos.where('pieceId').equals(remove.id).count()).resolves.toBe(0);
    await expect(db.inspections.get(inspection.id)).resolves.toMatchObject({
      id: inspection.id,
    });
  });
});
