import { Link, useParams } from 'react-router-dom';
import { useInspection, usePieces } from '../hooks/useInspectionData';
import { calculateInspectionProgress, getPieceWorkStatus } from '../services/progress';

const statusLabel = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  complete: 'Complete',
} as const;

export function InspectionOverviewPage() {
  const { inspectionId } = useParams();
  const inspection = useInspection(inspectionId);
  const pieces = usePieces(inspectionId);

  if (inspection === undefined || pieces === undefined) {
    return <p className="muted">Loading inspection…</p>;
  }

  if (inspection === null) {
    return <p className="muted">Inspection not found.</p>;
  }

  const progress = calculateInspectionProgress(pieces);

  return (
    <section className="stack">
      <div className="card">
        <h2>{inspection.name}</h2>
        <p className="muted">{inspection.siteName}</p>
        <p>
          {progress.completed} / {progress.total} pieces completed
        </p>
      </div>

      <Link className="btn btn-secondary btn-block" to={`/inspections/${inspection.id}/edit`}>
        Edit inspection details
      </Link>
      <Link className="btn btn-primary btn-block" to={`/inspections/${inspection.id}/pieces/new`}>
        Add piece
      </Link>

      {pieces.length === 0 ? (
        <div className="empty-state card">
          <h3>No pieces yet</h3>
          <p className="muted">Add the first inflatable as you start the inspection.</p>
        </div>
      ) : (
        pieces.map((piece) => {
          const status = getPieceWorkStatus(piece);
          const badgeClass =
            status === 'complete'
              ? 'badge badge-complete'
              : status === 'in-progress'
                ? 'badge badge-progress'
                : 'badge';

          return (
            <Link
              key={piece.id}
              className="card"
              to={`/inspections/${inspection.id}/pieces/${piece.id}`}
            >
              <h3>{piece.pieceNumber ? `Piece ${piece.pieceNumber}` : 'Unnumbered piece'}</h3>
              <p className="muted">{piece.serialNumber || 'No serial number'}</p>
              <span className={badgeClass}>{statusLabel[status]}</span>
            </Link>
          );
        })
      )}
    </section>
  );
}
