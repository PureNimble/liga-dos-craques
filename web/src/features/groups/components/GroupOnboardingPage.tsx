import { BallIcon } from '@/shared/components/ui/icons';
import { GroupChooser } from './GroupChooser';
import s from './GroupOnboardingPage.module.css';

/**
 * Ecrã forçado enquanto o utilizador não pertence a nenhum grupo — nada no
 * resto da app (jogos/rankings/desafios) faz sentido sem um grupo ativo.
 * Não é uma rota: o AppLayout renderiza isto em vez do shell normal.
 */
export function GroupOnboardingPage() {
  return (
    <main className={s.main}>
      <div aria-hidden className={s.glow} />

      <header className={s.header}>
        <span className={s.mark}>
          <BallIcon width={28} height={28} />
        </span>
        <h1 className={s.title}>Peladinhas</h1>
        <p className={s.subtitle}>Falta só um grupo</p>
      </header>

      <GroupChooser />
    </main>
  );
}
