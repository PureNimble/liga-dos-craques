import s from './Skeleton.module.css';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={[s.skeleton, className].filter(Boolean).join(' ')} />;
}

export function CardSkeleton() {
  return (
    <div className={s.card}>
      <Skeleton className={s.lineTitle} />
      <Skeleton className={s.lineSub} />
    </div>
  );
}
