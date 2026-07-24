import { Link } from 'react-router-dom';
import { CalendarIcon, PinIcon, PlusIcon } from '@/shared/components/ui/icons';
import { formatGameDateTimeByLang } from '@/shared/lib/datetime';
import { useNextGameSuspense } from '../hooks/gameHooks';
import s from './NextGameTeaser.module.css';
import { useT } from '@/shared/i18n/useT';

/**
 * Atalho na Navbar para o próximo jogo por jogar; sem jogos, convida a marcar
 * um. Suspense (ver `NextGameTeaserSlot`) garante que só aparece já resolvido
 * - nunca "sem jogos" por um instante antes do jogo real chegar.
 */
export function NextGameTeaser() {
  const { data: game } = useNextGameSuspense();
  const { t, lang } = useT();

  if (!game) {
    return (
      <Link to="/games/new" className={s.teaser}>
        <PlusIcon width={15} height={15} className={s.icon} />
        <span className={s.text}>{t('games.nextGameTeaser.noGames')}</span>
      </Link>
    );
  }

  return (
    <Link to={`/games/${game.id}`} className={s.teaser}>
      <CalendarIcon width={15} height={15} className={s.icon} />
      <span className={s.text}>
        <span className={s.hint}>{t('games.nextGameTeaser.nextGame')}</span>{' '}
        {formatGameDateTimeByLang(game.scheduled_at, lang)}
        {game.location && (
          <>
            <span className={s.dot} aria-hidden="true" />
            <span className={s.location}>
              <PinIcon width={13} height={13} className={s.pin} />
              {game.location}
            </span>
          </>
        )}
      </span>
    </Link>
  );
}
