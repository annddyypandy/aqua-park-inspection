import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../db';
import { DRingCondition, HoldsAir, LineCondition, ReadyStatus } from '../models';
import { generateInspectionPdf } from '../report/generatePdf';
import { reportFileName } from '../report/fileName';
import { classifyPiece, summarizePieces } from '../report/summary';
import { ReportLayout, type ReportPiece } from '../report/types';
import { addAnchor, updateAnchor } from '../services/anchorService';
import { createInspection } from '../services/inspectionService';
import { createPiece, updatePiece } from '../services/pieceService';
import { loadInspectionReport } from '../services/reportService';

describe('owner report', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.close();
  });

  it('classifies pressure failures as unsuitable and damaged lines as repair', () => {
    const failed: ReportPiece = {
      piece: pieceStub({ holdsAir: HoldsAir.No, readyStatus: ReadyStatus.NotAssessed }),
      anchors: [],
      photos: [],
    };
    const patched: ReportPiece = {
      piece: pieceStub({ readyStatus: ReadyStatus.YesIfRepaired }),
      anchors: [
        {
          id: 'a1',
          pieceId: 'p1',
          anchorNumber: '2',
          weightKg: 15,
          lineCondition: LineCondition.Damaged,
          lineNotes: 'Abrasion',
          createdAt: '',
          updatedAt: '',
        },
      ],
      photos: [],
    };
    const ready: ReportPiece = {
      piece: pieceStub({ holdsAir: HoldsAir.Yes, readyStatus: ReadyStatus.Yes }),
      anchors: [],
      photos: [],
    };

    expect(classifyPiece(failed)).toBe('unsuitable');
    expect(classifyPiece(patched)).toBe('repair');
    expect(classifyPiece(ready)).toBe('ready');
    expect(summarizePieces([failed, patched, ready])).toEqual({
      total: 3,
      ready: 1,
      repair: 1,
      unsuitable: 1,
      unassessed: 0,
    });
  });

  it('builds a report from stored inspection data and writes each layout as a PDF', async () => {
    const inspection = await createInspection({
      name: 'Winter 2026',
      siteName: 'Blue Lake',
      inspectionDate: '2026-09-21',
      inspectorName: 'Alex Reed',
      notes: 'End of season',
    });
    const piece = await createPiece(inspection.id, {
      pieceNumber: '007',
      serialNumber: 'SN-4418',
    });
    await updatePiece(piece.id, {
      holdsAir: HoldsAir.Yes,
      connectingDRingCondition: DRingCondition.Damaged,
      connectingDRingNotes: 'Bent',
      readyStatus: ReadyStatus.YesIfRepaired,
      readyNotes: 'Replace line',
    });
    const anchor = await addAnchor(piece.id);
    await updateAnchor(anchor.id, {
      weightKg: 15,
      lineCondition: LineCondition.Damaged,
      lineNotes: 'Abrasion at the splice',
    });

    const report = await loadInspectionReport(inspection.id);
    expect(report?.summary.repair).toBe(1);
    expect(report?.pieces[0]?.anchors).toHaveLength(1);

    expect(reportFileName(inspection, ReportLayout.Classic)).toBe(
      'Blue-Lake-Winter-2026-classic.pdf',
    );

    if (!report) {
      throw new Error('Expected report');
    }

    for (const layout of [
      ReportLayout.Classic,
      ReportLayout.Findings,
      ReportLayout.Sheets,
    ] as const) {
      const { bytes, fileName } = await generateInspectionPdf(report, layout);
      expect(fileName.endsWith(`-${layout}.pdf`)).toBe(true);
      expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('%PDF');
    }
  });
});

function pieceStub(
  patch: Partial<ReportPiece['piece']>,
): ReportPiece['piece'] {
  return {
    id: 'p1',
    inspectionId: 'i1',
    pieceNumber: '001',
    serialNumber: 'SN-1',
    holdsAir: HoldsAir.NotTested,
    holdsAirNotes: '',
    connectingDRingCondition: DRingCondition.NotAssessed,
    connectingDRingNotes: '',
    readyStatus: ReadyStatus.NotAssessed,
    readyNotes: '',
    isComplete: false,
    createdAt: '',
    updatedAt: '',
    ...patch,
  };
}
