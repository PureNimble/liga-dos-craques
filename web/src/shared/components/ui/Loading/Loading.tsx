import s from './Loading.module.css';

/** Centered loading spinner; `full` makes it fill the viewport height. */
export function Loading({ full = false }: { full?: boolean }) {
  return (
    <div className={`${s.wrap} ${full ? s.full : s.inline}`}>
      <span className={s.spinner} />
    </div>
  );
}
