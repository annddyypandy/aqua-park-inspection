import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useInspection, usePieces } from '../hooks/useInspectionData';
import type { Piece } from '../models';
import { deletePiece } from '../services/pieceService';
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
  const [pendingDelete, setPendingDelete] = useState<Piece | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (inspection === undefined || pieces === undefined) {
    return <p className="muted">Loading inspection…</p>;
  }

  if (inspection === null) {
    return <p className="muted">Inspection not found.</p>;
  }

  const progress = calculateInspectionProgress(pieces);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await deletePiece(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setError('Could not remove this piece.');
    }
  }

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

      {error ? <p className="save-indicator error">{error}</p> : null}

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
          const label = piece.pieceNumber ? `Piece ${piece.pieceNumber}` : 'Unnumbered piece';

          return (
            <article className="card" key={piece.id}>
              <h3>{label}</h3>
              <p className="muted">{piece.serialNumber || 'No serial number'}</p>
              <span className={badgeClass}>{statusLabel[status]}</span>
              <Link
                className="btn btn-primary btn-block"
                to={`/inspections/${inspection.id}/pieces/${piece.id}`}
              >
                Open piece
              </Link>
              <Button variant="danger" block onClick={() => setPendingDelete(piece)}>
                Remove piece
              </Button>
            </article>
          );
        })
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title="Remove this piece?"
          message={`“${pendingDelete.pieceNumber ? `Piece ${pendingDelete.pieceNumber}` : 'Unnumbered piece'}” and its photographs will be permanently removed from this inspection.`}
          confirmLabel="Remove piece"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void confirmDelete();
          }}
        />
      ) : null}
    </section>
  );
}
