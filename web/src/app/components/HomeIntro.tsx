import { useRankingOverall } from '@/features/rankings/hooks/rankingHooks';
import { useT } from '@/shared/i18n/useT';
import s from './HomeIntro.module.css';

/** Plain greeting (no card chrome) — name plus current ranking position, if any. */
export function HomeIntro({ welcomeName, playerId }: { welcomeName: string; playerId: string }) {
  const { t } = useT();
  const { data: ranking } = useRankingOverall();
  const position = ranking?.findIndex((r) => r.player_id === playerId) ?? -1;

  return (
    <div className={s.intro}>
      <p className={s.introWelcome}>{t('home.welcome')}</p>
      <h1 className={s.introName}>{welcomeName}</h1>
      {position >= 0 && (
        <p className={s.introMeta}>{t('home.season.position', { position: position + 1 })}</p>
      )}
    </div>
  );
}
