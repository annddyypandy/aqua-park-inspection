import type { DRingCondition, LineCondition } from '../../models';
import { Button } from '../ui/Button';

type Condition = LineCondition | DRingCondition;

interface YesNoFieldProps {
  legend: string;
  value: Condition;
  onChange: (value: Condition) => void;
}

export function YesNoField({ legend, value, onChange }: YesNoFieldProps) {
  return (
    <fieldset className="choice-fieldset">
      <legend>{legend}</legend>
      <div className="choice-row">
        <Button
          variant={value === 'good' ? 'primary' : 'secondary'}
          aria-pressed={value === 'good'}
          onClick={() => onChange(value === 'good' ? 'not-assessed' : 'good')}
        >
          Yes
        </Button>
        <Button
          variant={value === 'damaged' ? 'danger' : 'secondary'}
          aria-pressed={value === 'damaged'}
          onClick={() => onChange(value === 'damaged' ? 'not-assessed' : 'damaged')}
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
