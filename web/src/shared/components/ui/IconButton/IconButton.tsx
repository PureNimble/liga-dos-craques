import { type ButtonHTMLAttributes } from 'react';
import s from './IconButton.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

/** Icon-only button with an accessible label (used for `aria-label`/`title`). */
export function IconButton({ label, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={[s.iconButton, className].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}
