import Dexie, { type Table } from 'dexie';
import type { Anchor, DRing, Inspection, Photo, Piece } from '../models';

/**
 * Schema version 1 includes tables needed by later milestones so photo and
 * condition data can be added without a destructive migration.
 * Never delete this database from a service-worker update.
 */
export class AquaParkDatabase extends Dexie {
  inspections!: Table<Inspection, string>;
  pieces!: Table<Piece, string>;
  anchors!: Table<Anchor, string>;
  dRings!: Table<DRing, string>;
  photos!: Table<Photo, string>;

  constructor() {
    super('AquaParkInspection');

    this.version(1).stores({
      inspections: 'id, siteName, inspectionDate, updatedAt',
      pieces: 'id, inspectionId, pieceNumber, isComplete, updatedAt, [inspectionId+pieceNumber]',
      anchors: 'id, pieceId, anchorNumber',
      dRings: 'id, pieceId, dRingNumber',
      photos: 'id, pieceId, parentType, parentId',
    });
  }
}

export const db = new AquaParkDatabase();
