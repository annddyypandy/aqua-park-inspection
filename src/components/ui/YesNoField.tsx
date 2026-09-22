import type { DRingConditionValue, LineConditionValue } from '../../models';
import { Button } from './Button';

type Condition = LineConditionValue | DRingConditionValue;

interface YesNoFieldProps<T extends Condition> {
  legend: string;
  value: T;
  onChange: (value: T) => void;
}

export function YesNoField<T extends Condition>({ legend, value, onChange }: YesNoFieldProps<T>) {
  return (
    <fieldset className="choice-fieldset">
      <legend>{legend}</legend>
      <div className="choice-row">
        <Button
          variant={value === 'good' ? 'primary' : 'secondary'}
          aria-pressed={value === 'good'}
          onClick={() => onChange((value === 'good' ? 'not-assessed' : 'good') as T)}
        >
          Yes
        </Button>
        <Button
          variant={value === 'damaged' ? 'danger' : 'secondary'}
          aria-pressed={value === 'damaged'}
          onClick={() => onChange((value === 'damaged' ? 'not-assessed' : 'damaged') as T)}
        >
          No
        </Button>
      </div>
      <p className="muted">
        {value === 'good' ? 'Good' : value === 'damaged' ? 'Damaged' : 'Not assessed'}
      </p>
    </fieldset>
  );
}
