import { ChoiceField } from '../ui/ChoiceField';
import { TextAreaField } from '../ui/TextField';
import { HoldsAir, ReadyStatus, type HoldsAirValue, type ReadyStatusValue } from '../../models';

export interface PieceAssessmentState {
  holdsAir: HoldsAirValue;
  holdsAirNotes: string;
  readyStatus: ReadyStatusValue;
  readyNotes: string;
}

export function PieceAssessmentFields({
  value,
  onChange,
}: {
  value: PieceAssessmentState;
  onChange: (next: PieceAssessmentState) => void;
}) {
  return (
    <>
      <ChoiceField
        legend="Does the piece hold pressure?"
        value={value.holdsAir}
        unsetValue={HoldsAir.NotTested}
        options={[
          { value: HoldsAir.Yes, label: 'Yes', variant: 'primary' },
          { value: HoldsAir.No, label: 'No', variant: 'danger' },
        ]}
        onChange={(holdsAir) => onChange({ ...value, holdsAir })}
      />
      <TextAreaField
        id="holds-air-notes"
        label="Pressure notes"
        value={value.holdsAirNotes}
        onChange={(event) => onChange({ ...value, holdsAirNotes: event.target.value })}
      />
      <ChoiceField
        legend="Ready for use next year?"
        value={value.readyStatus}
        unsetValue={ReadyStatus.NotAssessed}
        layout="stack"
        options={[
          { value: ReadyStatus.Yes, label: 'Yes', variant: 'primary' },
          { value: ReadyStatus.YesIfRepaired, label: 'Yes if repaired', variant: 'primary' },
          { value: ReadyStatus.No, label: 'No', variant: 'danger' },
        ]}
        onChange={(readyStatus) => onChange({ ...value, readyStatus })}
      />
      <TextAreaField
        id="ready-notes"
        label="Readiness notes"
        value={value.readyNotes}
        onChange={(event) => onChange({ ...value, readyNotes: event.target.value })}
      />
    </>
  );
}
