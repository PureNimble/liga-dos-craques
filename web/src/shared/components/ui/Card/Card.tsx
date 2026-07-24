import { type HTMLAttributes } from 'react';
import s from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

/** Panel container with card styling; supports interactive hover state. */
export function Card({
  interactive = false,
  padded = true,
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={[s.card, padded ? s.padded : '', interactive ? s.interactive : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
