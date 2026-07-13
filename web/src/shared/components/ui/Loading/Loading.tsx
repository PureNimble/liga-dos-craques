import s from './Loading.module.css';

/** Estado de carregamento centrado (spinner). `full` ocupa a altura do ecrã. */
export function Loading({ full = false }: { full?: boolean }) {
  return (
    <div className={`${s.wrap} ${full ? s.full : s.inline}`}>
      <span className={s.spinner} />
    </div>
  );
}
