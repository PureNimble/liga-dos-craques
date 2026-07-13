import { type ReactNode } from 'react';
import s from './Field.module.css';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className={s.field}>
      <span className={s.label}>{label}</span>
      {children}
      {hint && !error && <span className={s.hint}>{hint}</span>}
      {error && <span className={s.error}>{error}</span>}
    </label>
  );
}
