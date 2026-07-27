import { type ReactNode } from 'react';
import s from './homePanel.module.css';

/** Borderless placeholder for an empty Home dashboard panel — icon chip + text, centered. */
export function HomePanelEmpty({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className={s.emptyWrap}>
      <div className={s.emptyState}>
        <span className={s.emptyIcon}>{icon}</span>
        <p className={s.emptyTitle}>{title}</p>
      </div>
    </div>
  );
}
