import { db } from '../db';
import {
  PhotoCategory,
  PhotoParentType,
  type Photo,
  type PhotoCategory as PhotoCategoryValue,
  type PhotoParentType as PhotoParentTypeValue,
} from '../models';
import { nowIso } from '../utils/dates';
import { createId } from '../utils/id';
import { processInspectionImage, PROCESSED_IMAGE_TYPE } from './imageProcessing';
import {
  materializePhoto,
  materializePhotos,
  toStoredBytes,
  type StoredPhoto,
} from './photoBlob';

export interface PhotoTarget {
  pieceId: string;
  parentType: PhotoParentTypeValue;
  parentId: string;
  category: PhotoCategoryValue;
}

export function piecePhotoTarget(pieceId: string): PhotoTarget {
  return {
    pieceId,
    parentType: PhotoParentType.Piece,
    parentId: pieceId,
    category: PhotoCategory.General,
  };
}

async function stampPieceActivity(pieceId: string): Promise<void> {
  const piece = await db.pieces.get(pieceId);
  if (!piece) {
    throw new Error('Piece not found.');
  }

  const timestamp = nowIso();
  await db.pieces.update(pieceId, { updatedAt: timestamp });
  await db.inspections.update(piece.inspectionId, { updatedAt: timestamp });
}

export async function saveProcessedPhoto(
  target: PhotoTarget,
  blob: Blob,
  mimeType = PROCESSED_IMAGE_TYPE,
  caption = '',
): Promise<Photo> {
  const bytes = await toStoredBytes(blob);
  const photo: StoredPhoto = {
    id: createId(),
    pieceId: target.pieceId,
    parentType: target.parentType,
    parentId: target.parentId,
    category: target.category,
    blob: bytes,
    mimeType,
    caption,
    createdAt: nowIso(),
  };

  await db.transaction('rw', db.photos, db.pieces, db.inspections, async () => {
    await db.photos.add(photo as Photo);
    await stampPieceActivity(target.pieceId);
  });

  return materializePhoto(photo);
}

export async function addPhotosFromFiles(
  target: PhotoTarget,
  files: File[],
): Promise<Photo[]> {
  const saved: Photo[] = [];

  for (const file of files) {
    if (file.type && !file.type.startsWith('image/')) {
      throw new Error('Only photographs can be added.');
    }

    const blob = await processInspectionImage(file);
    saved.push(await saveProcessedPhoto(target, blob));
  }

  return saved;
}

export async function listPhotosForParent(
  parentType: PhotoParentTypeValue,
  parentId: string,
): Promise<Photo[]> {
  const photos = await db.photos
    .where('parentId')
    .equals(parentId)
    .filter((photo) => photo.parentType === parentType)
    .toArray();

  const materialized = await materializePhotos(photos as StoredPhoto[]);
  return materialized.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updatePhotoCaption(id: string, caption: string): Promise<void> {
  const existing = await db.photos.get(id);
  if (!existing) {
    throw new Error('Photograph not found.');
  }

  await db.photos.update(id, { caption });
  await db.transaction('rw', db.pieces, db.inspections, async () => {
    await stampPieceActivity(existing.pieceId);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const existing = await db.photos.get(id);
  if (!existing) {
    return;
  }

  await db.transaction('rw', db.photos, db.pieces, db.inspections, async () => {
    await db.photos.delete(id);
    await stampPieceActivity(existing.pieceId);
  });
}
