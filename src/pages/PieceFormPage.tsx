import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnchorSection } from '../components/anchors/AnchorSection';
import { PhotoSection } from '../components/photos/PhotoSection';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SaveIndicator } from '../components/ui/SaveIndicator';
import { TextField } from '../components/ui/TextField';
import { piecePhotoTarget } from '../services/photoService';
import { useDebouncedAutoSave } from '../hooks/useDebouncedAutoSave';
import { usePiece } from '../hooks/useInspectionData';
import {
  createPiece,
  deletePiece,
  suggestNextPieceNumber,
  updatePiece,
} from '../services/pieceService';

interface PieceFormState {
  pieceNumber: string;
  serialNumber: string;
}

export function PieceFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { pieceId } = useParams();
  const existing = usePiece(mode === 'edit' ? pieceId : undefined);

  if (mode === 'edit' && existing === undefined) {
    return <p className="muted">Loading piece…</p>;
  }

  if (mode === 'edit' && existing === null) {
    return <p className="muted">Piece not found.</p>;
  }

  if (mode === 'edit' && existing) {
    return (
      <EditablePieceFields
        inspectionId={existing.inspectionId}
        pieceId={existing.id}
        pieceLabel={existing.pieceNumber ? `Piece ${existing.pieceNumber}` : 'this piece'}
        initial={{
          pieceNumber: existing.pieceNumber,
          serialNumber: existing.serialNumber,
        }}
      />
    );
  }

  return <CreatePieceFields />;
}

function CreatePieceFields() {
  const { inspectionId } = useParams();
  const navigate = useNavigate();
  const creatingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [createState, setCreateState] = useState<PieceFormState>({
    pieceNumber: '',
    serialNumber: '',
  });

  useEffect(() => {
    if (!inspectionId) {
      return;
    }

    void suggestNextPieceNumber(inspectionId).then((pieceNumber) => {
      setCreateState((current) =>
        current.pieceNumber ? current : { ...current, pieceNumber },
      );
    });
  }, [inspectionId]);

  async function persistNewPiece() {
    if (!inspectionId || !createState.pieceNumber.trim() || creatingRef.current) {
      return;
    }

    creatingRef.current = true;
    setError(null);

    try {
      const created = await createPiece(inspectionId, createState);
      navigate(`/inspections/${inspectionId}/pieces/${created.id}`, { replace: true });
    } catch {
      creatingRef.current = false;
      setError('Could not add this piece.');
      throw new Error('create-failed');
    }
  }

  const status = useDebouncedAutoSave(JSON.stringify(createState), persistNewPiece, {
    enabled: Boolean(inspectionId && createState.pieceNumber.trim()),
    // Suggested piece numbers should not create a record until the user edits or taps Add.
    skipInitial: true,
  });

  async function onCreate(event: FormEvent) {
    event.preventDefault();

    if (!createState.pieceNumber.trim()) {
      setError('Piece number is required.');
      return;
    }

    try {
      await persistNewPiece();
    } catch {
      // Error state is set inside persistNewPiece.
    }
  }

  return (
    <form className="stack" onSubmit={(event) => void onCreate(event)}>
      <SaveIndicator status={status} />
      <PieceFieldInputs value={createState} onChange={setCreateState} />
      {error ? <p className="save-indicator error">{error}</p> : null}
      <Button type="submit" variant="primary" block>
        Add piece
      </Button>
      <p className="muted">You can take photographs after this piece is created.</p>
    </form>
  );
}

function EditablePieceFields({
  inspectionId,
  pieceId,
  pieceLabel,
  initial,
}: {
  inspectionId: string;
  pieceId: string;
  pieceLabel: string;
  initial: PieceFormState;
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState<PieceFormState>(initial);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const snapshot = JSON.stringify(form);
  const status = useDebouncedAutoSave(
    snapshot,
    async () => {
      await updatePiece(pieceId, form);
    },
    { enabled: true },
  );

  async function confirmDelete() {
    try {
      await deletePiece(pieceId);
      navigate(`/inspections/${inspectionId}`, { replace: true });
    } catch {
      setError('Could not remove this piece.');
    }
  }

  return (
    <div className="stack">
      <SaveIndicator status={status} />
      <PieceFieldInputs value={form} onChange={setForm} />
      <AnchorSection pieceId={pieceId} />
      <PhotoSection title="Photos" target={piecePhotoTarget(pieceId)} />
      {error ? <p className="save-indicator error">{error}</p> : null}
      <Button variant="danger" block onClick={() => setPendingDelete(true)}>
        Remove piece
      </Button>
      {pendingDelete ? (
        <ConfirmDialog
          title="Remove this piece?"
          message={`“${pieceLabel}” and its photographs will be permanently removed from this inspection.`}
          confirmLabel="Remove piece"
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            void confirmDelete();
          }}
        />
      ) : null}
    </div>
  );
}

function PieceFieldInputs({
  value,
  onChange,
}: {
  value: PieceFormState;
  onChange: (next: PieceFormState) => void;
}) {
  return (
    <>
      <TextField
        id="piece-number"
        label="Piece number"
        value={value.pieceNumber}
        inputMode="numeric"
        autoComplete="off"
        onChange={(event) => onChange({ ...value, pieceNumber: event.target.value })}
      />
      <TextField
        id="piece-serial-number"
        label="Serial number"
        value={value.serialNumber}
        autoComplete="off"
        onChange={(event) => onChange({ ...value, serialNumber: event.target.value })}
      />
    </>
  );
}
