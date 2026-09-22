import { ChoiceField } from '../ui/ChoiceField';
import { TextAreaField } from '../ui/TextField';
import { YesNoField } from '../ui/YesNoField';
import {
  HoldsAir,
  ReadyStatus,
  type DRingConditionValue,
  type HoldsAirValue,
  type ReadyStatusValue,
} from '../../models';

export interface PieceAssessmentState {
  holdsAir: HoldsAirValue;
  holdsAirNotes: string;
  connectingDRingCondition: DRingConditionValue;
  connectingDRingNotes: string;
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
      <YesNoField
        legend="Connecting D-ring in good condition?"
        value={value.connectingDRingCondition}
        onChange={(connectingDRingCondition) =>
          onChange({ ...value, connectingDRingCondition })
        }
      />
      <TextAreaField
        id="connecting-dring-notes"
        label="Connecting D-ring notes"
        value={value.connectingDRingNotes}
        onChange={(event) =>
          onChange({ ...value, connectingDRingNotes: event.target.value })
        }
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
