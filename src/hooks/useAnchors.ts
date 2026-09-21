import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Anchor } from '../models';
import { normalizeAnchor } from '../services/anchorService';

export function useAnchors(pieceId: string | undefined): Anchor[] | undefined {
  return useLiveQuery(async () => {
    if (!pieceId) {
      return [];
    }

    const anchors = await db.anchors.where('pieceId').equals(pieceId).toArray();
    return anchors
      .map(normalizeAnchor)
      .sort((a, b) => a.anchorNumber.localeCompare(b.anchorNumber, undefined, { numeric: true }));
  }, [pieceId]);
}
