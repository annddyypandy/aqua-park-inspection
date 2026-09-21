import { useState } from 'react';
import { useAnchors } from '../../hooks/useAnchors';
import type { Anchor } from '../../models';
import { addAnchor, deleteAnchor } from '../../services/anchorService';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AnchorCard } from './AnchorCard';

export function AnchorSection({ pieceId }: { pieceId: string }) {
  const anchors = useAnchors(pieceId);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Anchor | null>(null);

  async function onAdd() {
    setError(null);
    try {
      await addAnchor(pieceId);
    } catch {
      setError('Could not add an anchor.');
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteAnchor(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setError('Could not remove this anchor.');
    }
  }

  return (
    <section className="stack" aria-labelledby={`anchors-${pieceId}`}>
      <h2 id={`anchors-${pieceId}`}>Anchors</h2>
      <p className="muted">Add one card per anchor on this piece. Weight is in kilograms.</p>
      <Button variant="primary" block onClick={() => void onAdd()}>
        Add anchor
      </Button>
      {error ? <p className="save-indicator error">{error}</p> : null}
      {anchors === undefined ? (
        <p className="muted">Loading anchors…</p>
      ) : anchors.length === 0 ? (
        <p className="muted">No anchors yet.</p>
      ) : (
        anchors.map((anchor) => (
          <AnchorCard key={anchor.id} anchor={anchor} onRequestDelete={setPendingDelete} />
        ))
      )}
      {pendingDelete ? (
        <ConfirmDialog
          title="Remove this anchor?"
          message={`Anchor ${pendingDelete.anchorNumber || ''} will be permanently removed from this piece.`}
          confirmLabel="Remove anchor"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void confirmDelete();
          }}
        />
      ) : null}
    </section>
  );
}
