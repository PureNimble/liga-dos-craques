import { type ButtonHTMLAttributes } from 'react';
import s from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: s.primary,
  secondary: s.secondary,
  ghost: s.ghost,
  danger: s.danger,
};
const sizeClass: Record<ButtonSize, string> = { sm: s.sm, md: s.md, lg: s.lg };

/** Standard button with variant/size styling and an optional loading state. */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[s.button, variantClass[variant], sizeClass[size], block ? s.block : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {loading && <span className={s.spinner} />}
      {loading ? 'Aguarda…' : children}
    </button>
  );
}
