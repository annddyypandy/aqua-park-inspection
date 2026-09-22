import { useState } from 'react';
import { useDebouncedAutoSave } from '../../hooks/useDebouncedAutoSave';
import { type Anchor, type LineConditionValue } from '../../models';
import { updateAnchor } from '../../services/anchorService';
import { formatWeightKg, parseWeightKg } from '../../utils/anchors';
import { Button } from '../ui/Button';
import { TextAreaField, TextField } from '../ui/TextField';
import { YesNoField } from '../ui/YesNoField';

interface AnchorCardProps {
  anchor: Anchor;
  onRequestDelete: (anchor: Anchor) => void;
}

interface AnchorFormState {
  anchorNumber: string;
  weightKg: string;
  lineCondition: LineConditionValue;
  lineNotes: string;
}

function toState(anchor: Anchor): AnchorFormState {
  return {
    anchorNumber: anchor.anchorNumber,
    weightKg: formatWeightKg(anchor.weightKg),
    lineCondition: anchor.lineCondition,
    lineNotes: anchor.lineNotes,
  };
}

export function AnchorCard({ anchor, onRequestDelete }: AnchorCardProps) {
  const [form, setForm] = useState<AnchorFormState>(() => toState(anchor));
  const [weightError, setWeightError] = useState<string | null>(null);
  const snapshot = JSON.stringify(form);
  const status = useDebouncedAutoSave(
    snapshot,
    async () => {
      let weightKg: number | null;
      try {
        weightKg = parseWeightKg(form.weightKg);
        setWeightError(null);
      } catch {
        setWeightError('Enter weight as a number in kg, or leave it blank.');
        return;
      }

      await updateAnchor(anchor.id, {
        anchorNumber: form.anchorNumber,
        weightKg,
        lineCondition: form.lineCondition,
        lineNotes: form.lineNotes,
      });
    },
    { enabled: true },
  );

  return (
    <article className="card">
      <h3>Anchor {form.anchorNumber || '—'}</h3>
      {status === 'saving' ? <p className="muted">Saving locally…</p> : null}
      {status === 'saved' ? <p className="muted">Saved on this device</p> : null}
      {status === 'error' ? (
        <p className="save-indicator error">Could not save this anchor.</p>
      ) : null}
      <TextField
        id={`anchor-number-${anchor.id}`}
        label="Anchor number"
        value={form.anchorNumber}
        inputMode="numeric"
        autoComplete="off"
        onChange={(event) => setForm({ ...form, anchorNumber: event.target.value })}
      />
      <TextField
        id={`anchor-weight-${anchor.id}`}
        label="Weight (kg)"
        value={form.weightKg}
        inputMode="decimal"
        autoComplete="off"
        onChange={(event) => setForm({ ...form, weightKg: event.target.value })}
      />
      {weightError ? <p className="save-indicator error">{weightError}</p> : null}
      <YesNoField
        legend="Line in good condition?"
        value={form.lineCondition}
        onChange={(lineCondition) => setForm({ ...form, lineCondition })}
      />
      <TextAreaField
        id={`anchor-line-notes-${anchor.id}`}
        label="Line notes"
        value={form.lineNotes}
        onChange={(event) => setForm({ ...form, lineNotes: event.target.value })}
      />
      <Button variant="danger" block onClick={() => onRequestDelete(anchor)}>
        Remove anchor
      </Button>
    </article>
  );
}
