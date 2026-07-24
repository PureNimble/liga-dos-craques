import { type ReactNode } from 'react';
import s from './Badge.module.css';

/** Color tone for a `Badge`. */
export type BadgeTone = 'gray' | 'sky' | 'green' | 'indigo' | 'amber' | 'purple' | 'red';

const toneClass: Record<BadgeTone, string> = {
  gray: s.gray,
  sky: s.sky,
  green: s.green,
  indigo: s.indigo,
  amber: s.amber,
  purple: s.purple,
  red: s.red,
};

/** Small pill-shaped label, optionally tinted with a `BadgeTone`. */
export function Badge({
  children,
  tone,
  className = '',
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={[s.badge, tone ? toneClass[tone] : '', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
