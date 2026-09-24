import { useState } from 'react';
import { useDebouncedAutoSave } from '../../hooks/useDebouncedAutoSave';
import { useObjectUrl } from '../../hooks/useObjectUrl';
import type { Photo } from '../../models';
import { updatePhotoCaption } from '../../services/photoService';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';

interface PhotoCardProps {
  photo: Photo;
  onRequestDelete: (photo: Photo) => void;
  onOpen: (photo: Photo) => void;
}

export function PhotoCard({ photo, onRequestDelete, onOpen }: PhotoCardProps) {
  const url = useObjectUrl(photo.blob);
  const [caption, setCaption] = useState(photo.caption);
  const status = useDebouncedAutoSave(
    caption,
    async (next) => {
      await updatePhotoCaption(photo.id, next);
    },
    { enabled: true },
  );

  return (
    <article className="card photo-card">
      <button
        type="button"
        className="photo-thumb"
        onClick={() => onOpen(photo)}
        aria-label={caption.trim() ? `View photo: ${caption}` : 'View photograph'}
      >
        {url ? <img src={url} alt={caption || 'Inspection photograph'} /> : (
          <p className="muted">Photograph could not be shown.</p>
        )}
      </button>
      <TextField
        id={`caption-${photo.id}`}
        label="Caption"
        value={caption}
        autoComplete="off"
        placeholder="Optional"
        onChange={(event) => setCaption(event.target.value)}
      />
      {status === 'saving' ? <p className="muted">Saving caption…</p> : null}
      {status === 'error' ? (
        <p className="save-indicator error">Could not save caption.</p>
      ) : null}
      <Button variant="danger" block onClick={() => onRequestDelete(photo)}>
        Delete photo
      </Button>
    </article>
  );
}
