import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReportPreview } from '../components/report/ReportPreview';
import { Button } from '../components/ui/Button';
import { generateInspectionPdf } from '../report/generatePdf';
import { layoutDescription, layoutTitle } from '../report/labels';
import { savePdfFile } from '../report/savePdf';
import {
  ReportLayout,
  type InspectionReport,
  type ReportLayout as ReportLayoutValue,
} from '../report/types';
import { loadInspectionReport } from '../services/reportService';

const LAYOUTS: ReportLayoutValue[] = [
  ReportLayout.Classic,
  ReportLayout.Findings,
  ReportLayout.Sheets,
];

export function InspectionReportPage() {
  const { inspectionId } = useParams();
  const [report, setReport] = useState<InspectionReport | null | undefined>(undefined);
  const [layout, setLayout] = useState<ReportLayoutValue>(ReportLayout.Classic);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inspectionId) {
      setReport(null);
      return;
    }

    let cancelled = false;
    void loadInspectionReport(inspectionId).then((loaded) => {
      if (!cancelled) {
        setReport(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [inspectionId]);

  async function createPdf() {
    if (!report) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { bytes, fileName } = await generateInspectionPdf(report, layout);
      await savePdfFile(bytes, fileName);
    } catch {
      setError('Could not create the PDF on this device.');
    } finally {
      setBusy(false);
    }
  }

  if (report === undefined) {
    return <p className="muted">Preparing report…</p>;
  }

  if (report === null) {
    return <p className="muted">Inspection not found.</p>;
  }

  return (
    <section className="stack report-screen">
      <div className="card report-toolbar">
        <h2>Owner report</h2>
        <p className="muted">
          Pick a layout, check the preview, then save a PDF to send to the lake owner. Nothing
          leaves this device until you share or download the file.
        </p>
        <fieldset className="choice-fieldset">
          <legend>Layout</legend>
          <div className="stack">
            {LAYOUTS.map((option) => (
              <Button
                key={option}
                variant={layout === option ? 'primary' : 'secondary'}
                block
                aria-pressed={layout === option}
                onClick={() => setLayout(option)}
              >
                {layoutTitle(option)}
              </Button>
            ))}
          </div>
        </fieldset>
        <p className="muted">{layoutDescription(layout)}</p>
        <Button variant="primary" block disabled={busy} onClick={() => void createPdf()}>
          {busy ? 'Creating PDF…' : 'Save PDF'}
        </Button>
        {error ? <p className="save-indicator error">{error}</p> : null}
      </div>
      <ReportPreview report={report} layout={layout} />
    </section>
  );
}
