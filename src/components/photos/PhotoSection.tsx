import { useState } from 'react';
import { usePhotosForParent } from '../../hooks/usePhotos';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import type { Photo } from '../../models';
import { addPhotosFromFiles, deletePhoto, type PhotoTarget } from '../../services/photoService';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { PhotoCard } from './PhotoCard';
import { PhotoPicker } from './PhotoPicker';

interface PhotoSectionProps {
  title: string;
  target: PhotoTarget;
}

export function PhotoSection({ title, target }: PhotoSectionProps) {
  const photos = usePhotosForParent(target.parentType, target.parentId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Photo | null>(null);
  const [preview, setPreview] = useState<Photo | null>(null);

  async function onFiles(files: File[]) {
    setBusy(true);
    setError(null);

    try {
      await addPhotosFromFiles(target, files);
    } catch {
      setError('Could not save that photograph. Try another image or take a new photo.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await deletePhoto(pendingDelete.id);
      setPendingDelete(null);
    } catch {
      setError('Could not delete that photograph.');
    }
  }

  return (
    <section className="stack" aria-labelledby={`photos-${target.parentId}`}>
      <h2 id={`photos-${target.parentId}`}>{title}</h2>
      <p className="muted">
        Photos are resized on this device before they are stored. They stay on the
        phone or tablet until you export a backup.
      </p>
      <PhotoPicker disabled={busy} onFiles={onFiles} />
      {busy ? <p className="muted">Saving photograph…</p> : null}
      {error ? <p className="save-indicator error">{error}</p> : null}

      {photos === undefined ? (
        <p className="muted">Loading photos…</p>
      ) : photos.length === 0 ? (
        <p className="muted">No photographs yet.</p>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onOpen={setPreview}
              onRequestDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this photograph?"
          message="This cannot be undone. The image will be removed from this device."
          confirmLabel="Delete photo"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            void confirmDelete();
          }}
        />
      ) : null}

      {preview ? <PhotoPreviewDialog photo={preview} onClose={() => setPreview(null)} /> : null}
    </section>
  );
}

function PhotoPreviewDialog({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const url = useObjectUrl(photo.blob);

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog photo-preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Photograph preview"
        onClick={(event) => event.stopPropagation()}
      >
        {url ? <img src={url} alt={photo.caption || 'Inspection photograph'} /> : null}
        {photo.caption ? <p>{photo.caption}</p> : null}
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
