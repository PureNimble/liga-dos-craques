import type { ReactNode } from 'react';
import { BallIcon } from '@/shared/components/ui/icons';
import s from './AuthLayout.module.css';

/** Shared frame for all authentication pages. */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className={s.main}>
      <div aria-hidden className={s.glow} />

      <header className={s.header}>
        <span className={s.mark}>
          <BallIcon width={30} height={30} />
        </span>
        <h1 className={s.title}>Peladinhas</h1>
        <p className={s.subtitle}>{title}</p>
      </header>

      <div className={s.card}>{children}</div>
    </main>
  );
}
