import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { DRingCondition, LineCondition } from '../models';
import { createInspection } from './inspectionService';
import { addAnchor, deleteAnchor, listAnchors, updateAnchor } from './anchorService';
import { createPiece } from './pieceService';

describe('anchor persistence', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.close();
  });

  it('adds numbered anchors and stores weight and yes/no conditions', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex',
      notes: '',
    });
    const piece = await createPiece(inspection.id, { pieceNumber: '001', serialNumber: '' });

    const first = await addAnchor(piece.id);
    const second = await addAnchor(piece.id);

    expect(first.anchorNumber).toBe('1');
    expect(second.anchorNumber).toBe('2');

    await updateAnchor(first.id, {
      weightKg: 15.5,
      lineCondition: LineCondition.Good,
      connectingDRingCondition: DRingCondition.Damaged,
      connectingDRingNotes: 'Bent',
    });

    const stored = await listAnchors(piece.id);
    expect(stored).toHaveLength(2);
    expect(stored[0]?.weightKg).toBe(15.5);
    expect(stored[0]?.lineCondition).toBe(LineCondition.Good);
    expect(stored[0]?.connectingDRingCondition).toBe(DRingCondition.Damaged);
    expect(stored[0]?.connectingDRingNotes).toBe('Bent');
  });

  it('deletes an anchor without deleting the piece', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex',
      notes: '',
    });
    const piece = await createPiece(inspection.id, { pieceNumber: '001', serialNumber: '' });
    const keep = await addAnchor(piece.id);
    const remove = await addAnchor(piece.id);

    await deleteAnchor(remove.id);

    const remaining = await listAnchors(piece.id);
    expect(remaining.map((anchor) => anchor.id)).toEqual([keep.id]);
    await expect(db.pieces.get(piece.id)).resolves.toMatchObject({ id: piece.id });
  });
});
