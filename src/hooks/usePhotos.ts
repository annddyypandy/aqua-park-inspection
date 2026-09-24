import { useLiveQuery } from 'dexie-react-hooks';
import type { Photo, PhotoParentTypeValue } from '../models';
import { listPhotosForParent } from '../services/photoService';

export function usePhotosForParent(
  parentType: PhotoParentTypeValue | undefined,
  parentId: string | undefined,
): Photo[] | undefined {
  return useLiveQuery(async () => {
    if (!parentType || !parentId) {
      return [];
    }

    return listPhotosForParent(parentType, parentId);
  }, [parentType, parentId]);
}
