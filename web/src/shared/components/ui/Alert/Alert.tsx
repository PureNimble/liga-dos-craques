import { type ReactNode } from 'react';
import s from './Alert.module.css';

const kindClass = { error: s.error, success: s.success, info: s.info } as const;

/** Inline banner for error, success, or info messages. */
export function Alert({
  kind,
  children,
}: {
  kind: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  return (
    <div className={[s.alert, kindClass[kind]].filter(Boolean).join(' ')} role="alert">
      {children}
    </div>
  );
}
