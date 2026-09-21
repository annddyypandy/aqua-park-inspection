import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Inspection, Piece } from '../models';
import { calculateInspectionProgress, type InspectionProgress } from '../services/progress';

export interface InspectionListItem {
  inspection: Inspection;
  progress: InspectionProgress;
}

export function useInspectionList(): InspectionListItem[] | undefined {
  return useLiveQuery(async () => {
    const inspections = await db.inspections.orderBy('updatedAt').reverse().toArray();
    const pieces = await db.pieces.toArray();

    return inspections.map((inspection) => ({
      inspection,
      progress: calculateInspectionProgress(
        pieces.filter((piece) => piece.inspectionId === inspection.id),
      ),
    }));
  }, []);
}

export function useInspection(
  inspectionId: string | undefined,
): Inspection | null | undefined {
  return useLiveQuery(async () => {
    if (!inspectionId) {
      return null;
    }

    return (await db.inspections.get(inspectionId)) ?? null;
  }, [inspectionId]);
}

export function usePieces(inspectionId: string | undefined): Piece[] | undefined {
  return useLiveQuery(async () => {
    if (!inspectionId) {
      return [];
    }

    const pieces = await db.pieces.where('inspectionId').equals(inspectionId).toArray();
    return pieces.sort((a, b) =>
      a.pieceNumber.localeCompare(b.pieceNumber, undefined, { numeric: true }),
    );
  }, [inspectionId]);
}

export function usePiece(pieceId: string | undefined): Piece | null | undefined {
  return useLiveQuery(async () => {
    if (!pieceId) {
      return null;
    }

    return (await db.pieces.get(pieceId)) ?? null;
  }, [pieceId]);
}
