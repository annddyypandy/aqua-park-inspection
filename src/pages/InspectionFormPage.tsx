import { useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { SaveIndicator } from '../components/ui/SaveIndicator';
import { TextAreaField, TextField } from '../components/ui/TextField';
import { useDebouncedAutoSave } from '../hooks/useDebouncedAutoSave';
import { useInspection } from '../hooks/useInspectionData';
import type { InspectionDraft } from '../models';
import { createInspection, updateInspection } from '../services/inspectionService';
import { todayIsoDate } from '../utils/dates';

interface FormState {
  name: string;
  siteName: string;
  inspectionDate: string;
  inspectorName: string;
  notes: string;
}

function toDraft(state: FormState): InspectionDraft {
  return {
    name: state.name,
    siteName: state.siteName,
    inspectionDate: state.inspectionDate,
    inspectorName: state.inspectorName,
    notes: state.notes,
  };
}

function hasRequiredInspectionFields(state: FormState): boolean {
  return Boolean(state.name.trim() && state.siteName.trim() && state.inspectionDate);
}

export function InspectionFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { inspectionId } = useParams();
  const existing = useInspection(mode === 'edit' ? inspectionId : undefined);

  if (mode === 'edit' && existing === undefined) {
    return <p className="muted">Loading inspection…</p>;
  }

  if (mode === 'edit' && existing === null) {
    return <p className="muted">Inspection not found.</p>;
  }

  if (mode === 'edit' && existing) {
    return <EditableInspectionFields inspectionId={existing.id} initial={existing} />;
  }

  return <CreateInspectionFields />;
}

function CreateInspectionFields() {
  const navigate = useNavigate();
  const creatingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [createState, setCreateState] = useState<FormState>({
    name: '',
    siteName: '',
    inspectionDate: todayIsoDate(),
    inspectorName: '',
    notes: '',
  });

  async function persistNewInspection() {
    if (!hasRequiredInspectionFields(createState) || creatingRef.current) {
      return;
    }

    creatingRef.current = true;
    setError(null);

    try {
      const created = await createInspection(toDraft(createState));
      navigate(`/inspections/${created.id}/edit`, { replace: true });
    } catch {
      creatingRef.current = false;
      setError('Could not create the inspection.');
      throw new Error('create-failed');
    }
  }

  const status = useDebouncedAutoSave(JSON.stringify(createState), persistNewInspection, {
    enabled: hasRequiredInspectionFields(createState),
    skipInitial: false,
  });

  async function onCreate(event: FormEvent) {
    event.preventDefault();

    if (!hasRequiredInspectionFields(createState)) {
      setError('Name, site, and date are required.');
      return;
    }

    try {
      await persistNewInspection();
    } catch {
      // Error state is set inside persistNewInspection.
    }
  }

  return (
    <form className="stack" onSubmit={(event) => void onCreate(event)}>
      <SaveIndicator status={status} />
      <InspectionFieldInputs value={createState} onChange={setCreateState} />
      {error ? <p className="save-indicator error">{error}</p> : null}
      <Button type="submit" variant="primary" block>
        Create inspection
      </Button>
    </form>
  );
}

function EditableInspectionFields({
  inspectionId,
  initial,
}: {
  inspectionId: string;
  initial: FormState;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const snapshot = JSON.stringify(form);
  const status = useDebouncedAutoSave(
    snapshot,
    async () => {
      await updateInspection(inspectionId, toDraft(form));
    },
    { enabled: true },
  );

  return (
    <div className="stack">
      <SaveIndicator status={status} />
      <InspectionFieldInputs value={form} onChange={setForm} />
    </div>
  );
}

function InspectionFieldInputs({
  value,
  onChange,
}: {
  value: FormState;
  onChange: (next: FormState) => void;
}) {
  return (
    <>
      <TextField
        id="inspection-name"
        label="Inspection name"
        value={value.name}
        autoComplete="off"
        onChange={(event) => onChange({ ...value, name: event.target.value })}
      />
      <TextField
        id="site-name"
        label="Site / lake name"
        value={value.siteName}
        autoComplete="off"
        onChange={(event) => onChange({ ...value, siteName: event.target.value })}
      />
      <TextField
        id="inspection-date"
        label="Inspection date"
        type="date"
        value={value.inspectionDate}
        onChange={(event) => onChange({ ...value, inspectionDate: event.target.value })}
      />
      <TextField
        id="inspector-name"
        label="Inspector name"
        value={value.inspectorName}
        autoComplete="name"
        onChange={(event) => onChange({ ...value, inspectorName: event.target.value })}
      />
      <TextAreaField
        id="inspection-notes"
        label="General notes"
        value={value.notes}
        onChange={(event) => onChange({ ...value, notes: event.target.value })}
      />
    </>
  );
}
