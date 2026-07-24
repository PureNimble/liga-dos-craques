import s from './Skeleton.module.css';

/** Shimmering placeholder block for loading content. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={[s.skeleton, className].filter(Boolean).join(' ')} />;
}

/** Skeleton placeholder shaped like a card with a title and subtitle line. */
export function CardSkeleton() {
  return (
    <div className={s.card}>
      <Skeleton className={s.lineTitle} />
      <Skeleton className={s.lineSub} />
    </div>
  );
}
