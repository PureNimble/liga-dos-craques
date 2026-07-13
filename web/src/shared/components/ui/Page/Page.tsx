import { type ReactNode } from 'react';
import s from './Page.module.css';

/** Contentor padrão de página (coluna, espaçamento e padding responsivo). */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={[s.page, className].filter(Boolean).join(' ')}>{children}</div>;
}

/** Título de página (h1). */
export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className={s.title}>{children}</h1>;
}
