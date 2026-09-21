import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  id: string;
  label: string;
}

export function TextField({
  id,
  label,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} {...props} />
    </label>
  );
}

export function TextAreaField({
  id,
  label,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <textarea id={id} {...props} />
    </label>
  );
}
