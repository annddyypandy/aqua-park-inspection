import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Photo, PhotoParentTypeValue } from '../models';

export function usePhotosForParent(
  parentType: PhotoParentTypeValue | undefined,
  parentId: string | undefined,
): Photo[] | undefined {
  return useLiveQuery(async () => {
    if (!parentType || !parentId) {
      return [];
    }

    const photos = await db.photos
      .where('parentId')
      .equals(parentId)
      .filter((photo) => photo.parentType === parentType)
      .toArray();

    return photos.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [parentType, parentId]);
}
