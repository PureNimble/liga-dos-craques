import { type ReactNode } from 'react';
import s from './Badge.module.css';

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={[s.badge, className].filter(Boolean).join(' ')}>{children}</span>;
}
