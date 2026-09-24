import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { PhotoCategory, PhotoParentType } from '../models';
import { createInspection } from './inspectionService';
import { createPiece } from './pieceService';
import type { StoredPhoto } from './photoBlob';
import {
  deletePhoto,
  listPhotosForParent,
  piecePhotoTarget,
  saveProcessedPhoto,
  updatePhotoCaption,
} from './photoService';

describe('photo persistence', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.close();
  });

  it('stores a photograph against a piece and restores it', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex',
      notes: '',
    });
    const piece = await createPiece(inspection.id, {
      pieceNumber: '001',
      serialNumber: 'SN-1',
    });

    const blob = new Blob(['fake-jpeg'], { type: 'image/jpeg' });
    const photo = await saveProcessedPhoto(piecePhotoTarget(piece.id), blob);

    const stored = await listPhotosForParent(PhotoParentType.Piece, piece.id);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.id).toBe(photo.id);
    expect(stored[0]?.parentType).toBe(PhotoParentType.Piece);
    expect(stored[0]?.parentId).toBe(piece.id);
    expect(stored[0]?.category).toBe(PhotoCategory.General);
    expect(stored[0]?.blob).toBeInstanceOf(Blob);
    expect(await stored[0]?.blob.text()).toBe('fake-jpeg');
    expect(stored[0]?.blob.type).toBe('image/jpeg');

    const raw = (await db.photos.get(photo.id)) as StoredPhoto | undefined;
    expect(raw?.blob instanceof Blob).toBe(false);
    expect(
      raw?.blob instanceof ArrayBuffer || ArrayBuffer.isView(raw?.blob),
    ).toBe(true);
  });

  it('updates captions and deletes only after an explicit delete call', async () => {
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

    const photo = await saveProcessedPhoto(
      piecePhotoTarget(piece.id),
      new Blob(['a'], { type: 'image/jpeg' }),
    );

    await updatePhotoCaption(photo.id, 'Crack near serial plate');
    const withCaption = await db.photos.get(photo.id);
    expect(withCaption?.caption).toBe('Crack near serial plate');

    await deletePhoto(photo.id);
    await expect(listPhotosForParent(PhotoParentType.Piece, piece.id)).resolves.toEqual([]);
  });
});
