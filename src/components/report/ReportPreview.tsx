import { useEffect, useMemo, useRef, useState } from 'react';
import type { Photo } from '../../models';
import { formatDisplayDate } from '../../utils/dates';
import { formatWeightKg } from '../../utils/anchors';
import {
  conditionLabel,
  holdsAirLabel,
  outcomeLabel,
  photoCaption,
  pieceHeading,
  readyLabel,
  serialLabel,
  weightLabel,
} from '../../report/labels';
import { classifyPiece, findingReasons, pieceFlags } from '../../report/summary';
import type { InspectionReport, ReportLayout, ReportPiece } from '../../report/types';

export function ReportPreview({
  report,
  layout,
}: {
  report: InspectionReport;
  layout: ReportLayout;
}) {
  const urls = usePhotoUrls(report.pieces.flatMap((entry) => entry.photos));

  if (layout === 'findings') {
    return <FindingsPreview report={report} urls={urls} />;
  }
  if (layout === 'sheets') {
    return <SheetsPreview report={report} urls={urls} />;
  }
  return <ClassicPreview report={report} urls={urls} />;
}

function ClassicPreview({
  report,
  urls,
}: {
  report: InspectionReport;
  urls: Record<string, string>;
}) {
  const { inspection, summary } = report;
  const attention = report.pieces.filter((entry) => {
    const outcome = classifyPiece(entry);
    return outcome === 'repair' || outcome === 'unsuitable';
  });

  return (
    <div className="report-pages">
      <article className="report-page">
        <p className="report-kicker">End of season condition report</p>
        <h2>Aqua Park Condition Inspection</h2>
        <p className="report-site">{inspection.siteName || 'No site name'}</p>
        <dl className="report-meta">
          <div>
            <dt>Inspection</dt>
            <dd>{inspection.name || 'Untitled inspection'}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDisplayDate(inspection.inspectionDate)}</dd>
          </div>
          <div>
            <dt>Inspector</dt>
            <dd>{inspection.inspectorName || 'Not recorded'}</dd>
          </div>
        </dl>
        <p className="report-muted">
          {inspection.notes.trim() ||
            'Prepared for the lake owner. Findings are from a physical inspection of inflatable equipment after removal from the water.'}
        </p>
      </article>

      <article className="report-page">
        <h3>Executive summary</h3>
        <div className="report-kpis">
          <div>
            <strong>{summary.total}</strong>
            <span>Pieces inspected</span>
          </div>
          <div>
            <strong>{summary.ready}</strong>
            <span>Ready</span>
          </div>
          <div>
            <strong>{summary.repair}</strong>
            <span>Ready if repaired</span>
          </div>
          <div>
            <strong>{summary.unsuitable}</strong>
            <span>Not ready</span>
          </div>
        </div>
        <h4>Needs attention</h4>
        {attention.length === 0 ? (
          <p className="report-muted">No repair or withdrawal items were recorded.</p>
        ) : (
          <ul className="report-issues">
            {attention.map((entry) => (
              <li key={entry.piece.id}>
                <strong>{pieceHeading(entry.piece)}</strong>
                {' — '}
                {findingReasons(entry)[0] ?? outcomeLabel(classifyPiece(entry))}
              </li>
            ))}
          </ul>
        )}
        {summary.unassessed > 0 ? (
          <p className="report-muted">
            {summary.unassessed} piece{summary.unassessed === 1 ? '' : 's'} not yet assessed.
          </p>
        ) : null}
      </article>

      {report.pieces.map((entry) => (
        <PieceDetailPage key={entry.piece.id} entry={entry} urls={urls} />
      ))}
    </div>
  );
}

function FindingsPreview({
  report,
  urls,
}: {
  report: InspectionReport;
  urls: Record<string, string>;
}) {
  const unsuitable = report.pieces.filter((entry) => classifyPiece(entry) === 'unsuitable');
  const repair = report.pieces.filter((entry) => classifyPiece(entry) === 'repair');

  return (
    <div className="report-pages">
      <article className="report-page">
        <p className="report-kicker">
          {report.inspection.siteName || 'Site'} · {formatDisplayDate(report.inspection.inspectionDate)}
        </p>
        <h2>What needs doing</h2>
        <p className="report-muted">
          This page is the working list for the owner. Pieces not listed here are ready as-is.
        </p>
        <h4>Do not use</h4>
        {unsuitable.length === 0 ? (
          <p className="report-muted">None.</p>
        ) : (
          unsuitable.map((entry) => (
            <FindingBlock key={entry.piece.id} entry={entry} urls={urls} />
          ))
        )}
        <h4>Repair before next season</h4>
        {repair.length === 0 ? (
          <p className="report-muted">None.</p>
        ) : (
          repair.map((entry) => <FindingBlock key={entry.piece.id} entry={entry} urls={urls} />)
        )}
      </article>
      <article className="report-page">
        <h3>Full inventory</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Piece</th>
              <th>Pressure</th>
              <th>Ready</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {report.pieces.length === 0 ? (
              <tr>
                <td colSpan={4}>No pieces recorded.</td>
              </tr>
            ) : (
              report.pieces.map((entry) => (
                <tr key={entry.piece.id}>
                  <td>{entry.piece.pieceNumber.trim() || '—'}</td>
                  <td>{holdsAirLabel(entry.piece.holdsAir)}</td>
                  <td>{readyLabel(entry.piece.readyStatus)}</td>
                  <td>{pieceFlags(entry).join(', ') || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
    </div>
  );
}

function SheetsPreview({
  report,
  urls,
}: {
  report: InspectionReport;
  urls: Record<string, string>;
}) {
  const header = `${report.inspection.siteName || 'Site'} · ${formatDisplayDate(report.inspection.inspectionDate)} · ${report.inspection.inspectorName || 'Inspector not recorded'}`;

  if (report.pieces.length === 0) {
    return (
      <div className="report-pages">
        <article className="report-page">
          <p className="report-kicker">{header}</p>
          <p className="report-muted">No pieces were recorded on this inspection.</p>
        </article>
      </div>
    );
  }

  return (
    <div className="report-pages">
      {report.pieces.map((entry) => {
        const outcome = classifyPiece(entry);
        return (
          <article className="report-page" key={entry.piece.id}>
            <p className="report-sheet-bar">{header}</p>
            <div className="report-sheet-grid">
              <div>
                <h3>{pieceHeading(entry.piece)}</h3>
                <p className="report-muted">{serialLabel(entry.piece)}</p>
                <p className={statusClass(outcome)}>{outcomeLabel(outcome)}</p>
                <dl className="report-facts">
                  <div>
                    <dt>Holds pressure</dt>
                    <dd>
                      {holdsAirLabel(entry.piece.holdsAir)}
                      {entry.piece.holdsAirNotes.trim()
                        ? ` — ${entry.piece.holdsAirNotes.trim()}`
                        : ''}
                    </dd>
                  </div>
                  {entry.anchors.length === 0 ? (
                    <div>
                      <dt>Anchors</dt>
                      <dd>None recorded</dd>
                    </div>
                  ) : (
                    entry.anchors.map((anchor) => (
                      <div key={anchor.id}>
                        <dt>Anchor {anchor.anchorNumber}</dt>
                        <dd>
                          {weightLabel(anchor.weightKg)} · line {conditionLabel(anchor.lineCondition)} ·
                          D-ring {conditionLabel(anchor.connectingDRingCondition)}
                        </dd>
                      </div>
                    ))
                  )}
                </dl>
                <p className="report-muted">{sheetCaption(entry)}</p>
              </div>
              <PhotoStrip photos={entry.photos} urls={urls} stacked />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PieceDetailPage({
  entry,
  urls,
}: {
  entry: ReportPiece;
  urls: Record<string, string>;
}) {
  const outcome = classifyPiece(entry);
  return (
    <article className="report-page">
      <header className="report-piece-head">
        <h3>{pieceHeading(entry.piece)}</h3>
        <p className={statusClass(outcome)}>{outcomeLabel(outcome)}</p>
      </header>
      <p className="report-muted">
        {serialLabel(entry.piece)} · Holds pressure: {holdsAirLabel(entry.piece.holdsAir)}
      </p>
      <table className="report-table">
        <thead>
          <tr>
            <th>Anchor</th>
            <th>Weight</th>
            <th>Line</th>
            <th>D-ring</th>
          </tr>
        </thead>
        <tbody>
          {entry.anchors.length === 0 ? (
            <tr>
              <td colSpan={4}>No anchors recorded</td>
            </tr>
          ) : (
            entry.anchors.map((anchor) => {
              const flagged =
                conditionLabel(anchor.lineCondition) === 'Damaged' ||
                conditionLabel(anchor.connectingDRingCondition) === 'Damaged';
              return (
                <tr className={flagged ? 'flagged' : undefined} key={anchor.id}>
                  <td>{anchor.anchorNumber}</td>
                  <td>{formatWeightKg(anchor.weightKg) ? weightLabel(anchor.weightKg) : '—'}</td>
                  <td>{conditionLabel(anchor.lineCondition)}</td>
                  <td>{conditionLabel(anchor.connectingDRingCondition)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {findingReasons(entry).map((reason) => (
        <p className="report-muted" key={reason}>
          {reason}
        </p>
      ))}
      <PhotoStrip photos={entry.photos} urls={urls} />
    </article>
  );
}

function FindingBlock({
  entry,
  urls,
}: {
  entry: ReportPiece;
  urls: Record<string, string>;
}) {
  return (
    <div className="report-finding">
      <p>
        <strong>{pieceHeading(entry.piece)}</strong> · {serialLabel(entry.piece)}
      </p>
      {findingReasons(entry).map((reason) => (
        <p key={reason}>{reason}</p>
      ))}
      <PhotoStrip photos={entry.photos.slice(0, 2)} urls={urls} />
    </div>
  );
}

function PhotoStrip({
  photos,
  urls,
  stacked = false,
}: {
  photos: Photo[];
  urls: Record<string, string>;
  stacked?: boolean;
}) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className={stacked ? 'report-photos stacked' : 'report-photos'}>
      {photos.map((photo) => (
        <figure key={photo.id}>
          {urls[photo.id] ? (
            <img src={urls[photo.id]} alt={photoCaption(photo)} />
          ) : (
            <div className="report-photo-fallback" />
          )}
          <figcaption>{photoCaption(photo)}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function sheetCaption(entry: ReportPiece): string {
  const reasons = findingReasons(entry);
  if (reasons[0]) {
    return reasons.join(' ');
  }
  const outcome = classifyPiece(entry);
  if (outcome === 'ready') {
    return 'No defects. Suitable for use next season without repair.';
  }
  if (outcome === 'repair') {
    return 'Ready if repaired.';
  }
  if (outcome === 'unsuitable') {
    return 'Not ready for next season.';
  }
  return 'Not yet assessed.';
}

function statusClass(outcome: ReturnType<typeof classifyPiece>): string {
  if (outcome === 'ready') {
    return 'report-status ok';
  }
  if (outcome === 'unassessed') {
    return 'report-status';
  }
  return 'report-status repair';
}

function usePhotoUrls(photos: Photo[]): Record<string, string> {
  const signature = useMemo(() => photos.map((photo) => photo.id).join(','), [photos]);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const current = photosRef.current;
    const next: Record<string, string> = {};
    for (const photo of current) {
      next[photo.id] = URL.createObjectURL(photo.blob);
    }
    setUrls(next);
    return () => {
      Object.values(next).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [signature]);

  return urls;
}
