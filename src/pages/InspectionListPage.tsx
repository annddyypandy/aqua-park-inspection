import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useInspectionList, type InspectionListItem } from '../hooks/useInspectionData';
import { deleteInspection } from '../services/inspectionService';
import { formatDisplayDate } from '../utils/dates';

export function InspectionListPage() {
  const items = useInspectionList();
  const [pendingDelete, setPendingDelete] = useState<InspectionListItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await deleteInspection(pendingDelete.inspection.id);
      setPendingDelete(null);
    } catch {
      setError('Could not delete this inspection.');
    }
  }

  return (
    <section className="stack">
      <Link className="btn btn-primary btn-block" to="/inspections/new">
        Create inspection
      </Link>

      {error ? <p className="save-indicator error">{error}</p> : null}

      {items === undefined ? (
        <p className="muted">Loading inspections…</p>
      ) : items.length === 0 ? (
        <div className="empty-state card">
          <h2>No inspections yet</h2>
          <p className="muted">
            Create an inspection, then add pieces as you work along the lake.
            Everything is saved on this device.
          </p>
        </div>
      ) : (
        <div className="inspection-grid">
          {items.map((item) => (
            <article className="card" key={item.inspection.id}>
              <h2>{item.inspection.name || 'Untitled inspection'}</h2>
              <p className="muted">{item.inspection.siteName || 'No site name'}</p>
              <p>{formatDisplayDate(item.inspection.inspectionDate)}</p>
              <p>
                {item.progress.completed} / {item.progress.total} pieces completed
              </p>
              <div className="progress-bar" aria-hidden="true">
                <span
                  style={{
                    width:
                      item.progress.total === 0
                        ? '0%'
                        : `${Math.round((item.progress.completed / item.progress.total) * 100)}%`,
                  }}
                />
              </div>
              <Link className="btn btn-primary btn-block" to={`/inspections/${item.inspection.id}`}>
                Open inspection
              </Link>
              <Button variant="danger" block onClick={() => setPendingDelete(item)}>
                Delete inspection
              </Button>
            </article>
          ))}
        </div>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this inspection?"
          message={`“${pendingDelete.inspection.name || 'Untitled inspection'}” and all of its pieces will be permanently removed from this device.`}
          confirmLabel="Delete inspection"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void confirmDelete();
          }}
        />
      ) : null}
    </section>
  );
}
