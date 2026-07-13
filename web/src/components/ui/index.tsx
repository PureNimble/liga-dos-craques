import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

export { Modal } from './Modal';
// ConfirmProvider / useConfirm vivem em './ConfirmDialog' (importar de lá diretamente,
// para não misturar hooks com o barril de componentes — react-refresh).

/* -------------------------------------------------------------------------- */
/*  Button                                                                      */
/* -------------------------------------------------------------------------- */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-pitch-400 to-pitch-500 text-navy-975 hover:from-pitch-300 hover:to-pitch-400 shadow-glow disabled:opacity-60',
  secondary: 'border border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]',
  ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  danger: 'bg-red-500 text-white hover:bg-red-400 disabled:bg-red-500/50',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

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
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${
        buttonStyles[variant]
      } ${buttonSizes[size]} ${block ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {loading ? 'Aguarda…' : children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  IconButton                                                                  */
/* -------------------------------------------------------------------------- */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-navy-800 hover:text-white ${className}`}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                        */
/* -------------------------------------------------------------------------- */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padded?: boolean;
}

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
      className={`rounded-2xl border border-white/[0.07] bg-gradient-to-b from-navy-850/70 to-navy-900 shadow-card ${
        padded ? 'p-4' : ''
      } ${interactive ? 'transition-all hover:border-white/[0.12] hover:from-navy-800/70 hover:to-navy-850 active:scale-[0.995]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Badge                                                                        */
/* -------------------------------------------------------------------------- */
export function Badge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                       */
/* -------------------------------------------------------------------------- */
interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
} as const;

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '');
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        className={`${AVATAR_SIZES[size]} shrink-0 rounded-full border border-navy-700 object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`${AVATAR_SIZES[size]} inline-flex shrink-0 items-center justify-center rounded-full border border-navy-700 bg-gradient-to-br from-navy-700 to-navy-850 font-bold uppercase text-slate-200 ${className}`}
    >
      {initials(name)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  SegmentedTabs (estilo pill, tipo FotMob)                                    */
/* -------------------------------------------------------------------------- */
interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  items: TabItem<T>[];
  className?: string;
}

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  className = '',
}: SegmentedTabsProps<T>) {
  return (
    <div
      className={`inline-flex gap-1 rounded-xl border border-navy-800 bg-navy-900 p-1 ${className}`}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            value === item.value
              ? 'bg-pitch-500 text-navy-975 shadow-glow'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PillTabs (seletor horizontal com scroll — muitos itens)                     */
/* -------------------------------------------------------------------------- */
interface PillTabsProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: ReactNode }[];
  className?: string;
}

export function PillTabs<T extends string | number>({
  value,
  onChange,
  items,
  className = '',
}: PillTabsProps<T>) {
  return (
    <div className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 ${className}`}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
            value === item.value
              ? 'bg-pitch-500 text-navy-975 shadow-glow'
              : 'bg-navy-800 text-slate-300 hover:bg-navy-700 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field (label + erro)                                                        */
/* -------------------------------------------------------------------------- */
interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Input                                                                       */
/* -------------------------------------------------------------------------- */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full min-w-0 rounded-xl border border-navy-700 bg-navy-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30 ${className}`}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  Select                                                                      */
/* -------------------------------------------------------------------------- */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...props }, ref) {
    return (
      <select
        ref={ref}
        {...props}
        className={`w-full min-w-0 rounded-xl border border-navy-700 bg-navy-950 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30 ${className}`}
      >
        {children}
      </select>
    );
  },
);

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                     */
/* -------------------------------------------------------------------------- */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-navy-800 after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-navy-800 bg-navy-900 p-4">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-2.5 h-3 w-1/3" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Alert                                                                        */
/* -------------------------------------------------------------------------- */
export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-red-500/40 bg-red-500/10 text-red-300',
    success: 'border-pitch-500/40 bg-pitch-500/10 text-pitch-400',
    info: 'border-navy-700 bg-navy-900 text-slate-300',
  } as const;
  return (
    <div className={`rounded-xl border p-3 text-sm ${styles[kind]}`} role="alert">
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  EmptyState                                                                   */
/* -------------------------------------------------------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy-700 bg-navy-900/40 px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-slate-400">
          {icon}
        </div>
      )}
      <p className="font-semibold text-slate-200">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
