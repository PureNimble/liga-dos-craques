import { type ReactNode } from 'react';
import { LockIcon } from '../icons';
import s from './LockOverlay.module.css';

interface LockOverlayProps {
  locked: boolean;
  message: string;
  className?: string;
  children: ReactNode;
}

/** Shows blurred content with a lock icon and message when `locked` is true. */
export function LockOverlay({ locked, message, className = '', children }: LockOverlayProps) {
  if (!locked) return <>{children}</>;
  return (
    <div className={[s.wrap, className].filter(Boolean).join(' ')}>
      <div className={s.blurred} aria-hidden>
        {children}
      </div>
      <div className={s.overlay}>
        <span className={s.badge} aria-hidden>
          <LockIcon width={20} height={20} />
        </span>
        <span className={s.message}>{message}</span>
      </div>
    </div>
  );
}
