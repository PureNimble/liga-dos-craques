import s from './Avatar.module.css';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClass: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: s.sm,
  md: s.md,
  lg: s.lg,
  xl: s.xl,
};

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
        className={[s.image, sizeClass[size], className].filter(Boolean).join(' ')}
      />
    );
  }
  return (
    <span className={[s.fallback, sizeClass[size], className].filter(Boolean).join(' ')}>
      {initials(name)}
    </span>
  );
}
