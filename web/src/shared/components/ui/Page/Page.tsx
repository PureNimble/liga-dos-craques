import { type ReactNode } from 'react';
import s from './Page.module.css';

/** Standard page container (column layout, responsive spacing/padding). */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={[s.page, className].filter(Boolean).join(' ')}>{children}</div>;
}

/** Page title (h1). */
export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className={s.title}>{children}</h1>;
}
