import type { PhotoCategory, PhotoParentType } from './enums';

/**
 * Photos always belong to a piece. parentType + parentId identify the more
 * specific subject (the piece itself, an anchor, a D-ring, or a piece-level
 * assessment such as air pressure / readiness).
 */
export interface Photo {
  id: string;
  pieceId: string;
  parentType: PhotoParentType;
  parentId: string;
  category: PhotoCategory;
  blob: Blob;
  mimeType: string;
  caption: string;
  createdAt: string;
}
