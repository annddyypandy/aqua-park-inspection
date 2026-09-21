import { Button } from './Button';

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ChoiceFieldProps<T extends string> {
  legend: string;
  value: T;
  unsetValue: T;
  options: ChoiceOption<T>[];
  layout?: 'row' | 'stack';
  onChange: (value: T) => void;
}

export function ChoiceField<T extends string>({
  legend,
  value,
  unsetValue,
  options,
  layout = 'row',
  onChange,
}: ChoiceFieldProps<T>) {
  return (
    <fieldset className="choice-fieldset">
      <legend>{legend}</legend>
      <div className={layout === 'stack' ? 'stack' : 'choice-row'}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Button
              key={option.value}
              variant={selected ? (option.variant ?? 'primary') : 'secondary'}
              block={layout === 'stack'}
              aria-pressed={selected}
              onClick={() => onChange(selected ? unsetValue : option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
