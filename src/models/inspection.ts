export interface Inspection {
  id: string;
  name: string;
  siteName: string;
  /** ISO calendar date (YYYY-MM-DD). */
  inspectionDate: string;
  inspectorName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type InspectionDraft = Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>;
