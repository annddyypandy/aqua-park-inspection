import type { SaveStatus } from '../../hooks/useDebouncedAutoSave';

export function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') {
    return <p className="save-indicator muted" aria-live="polite" />;
  }

  if (status === 'saving') {
    return (
      <p className="save-indicator muted" aria-live="polite">
        Saving locally…
      </p>
    );
  }

  if (status === 'error') {
    return (
      <p className="save-indicator error" aria-live="assertive">
        Could not save. Check device storage and try again.
      </p>
    );
  }

  return (
    <p className="save-indicator muted" aria-live="polite">
      Saved on this device
    </p>
  );
}
