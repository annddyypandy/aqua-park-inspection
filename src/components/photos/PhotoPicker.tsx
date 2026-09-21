import { useRef, type ChangeEvent } from 'react';
import { Button } from '../ui/Button';

interface PhotoPickerProps {
  disabled?: boolean;
  onFiles: (files: File[]) => Promise<void> | void;
}

export function PhotoPicker({ disabled = false, onFiles }: PhotoPickerProps) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);

  function takeFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    if (selected.length > 0) {
      void onFiles(selected);
    }
  }

  return (
    <div className="stack">
      <input
        ref={cameraInput}
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        aria-hidden="true"
        tabIndex={-1}
        onChange={takeFiles}
      />
      <input
        ref={libraryInput}
        className="visually-hidden"
        type="file"
        accept="image/*"
        multiple
        aria-hidden="true"
        tabIndex={-1}
        onChange={takeFiles}
      />
      <Button
        variant="primary"
        block
        disabled={disabled}
        onClick={() => cameraInput.current?.click()}
      >
        Take photo
      </Button>
      <Button
        variant="secondary"
        block
        disabled={disabled}
        onClick={() => libraryInput.current?.click()}
      >
        Choose from library
      </Button>
    </div>
  );
}
