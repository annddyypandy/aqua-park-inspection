import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-title">{title}</h2>
        <p className="muted">{message}</p>
        <Button variant="danger" block onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" block onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
