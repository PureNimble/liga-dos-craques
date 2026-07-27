import { Link } from 'react-router-dom';
import type { PeriodSpotlightPlayer } from '@/features/stats/hooks/statsHooks';
import { ratingText } from '@/features/stats/lib/ratingColor';
import { Avatar } from '@/shared/components/ui';
import { BallIcon, BootIcon, ChevronRightIcon, StarIcon } from '@/shared/components/ui/icons';
import { PLACEHOLDER_PLAYER_PHOTO } from '@/shared/lib/placeholderPhoto';
import { useT } from '@/shared/i18n/useT';
import { HomePanelEmpty } from './HomePanelEmpty';
import panel from './homePanel.module.css';
import s from './HomePeriodSpotlight.module.css';

/** A player-of-the-period card: goals, assists and average rating for that window.
 *  `featured` (player of the week) leads with a large photo; the compact default
 *  (player of the month, in the shorter bottom row) stays a small-avatar row. */
export function HomePeriodSpotlight({
  titleKey,
  data: top,
  featured = false,
}: {
  titleKey: 'home.spotlight.week.title' | 'home.spotlight.month.title';
  data: PeriodSpotlightPlayer | null | undefined;
  featured?: boolean;
}) {
  const { t } = useT();

  if (featured) {
    return (
      <div className={s.spotlightCard}>
        <div className={s.spotlightHeader}>
          <h2 className={s.spotlightHeaderBadge}>{t(titleKey)}</h2>
        </div>
        {!top ? (
          <HomePanelEmpty
            icon={<StarIcon width={22} height={22} />}
            title={t('home.spotlight.empty')}
          />
        ) : (
          <Link to={`/players/${top.playerId}`} className={s.spotlightBody}>
            <div className={s.spotlightInfo}>
              <div className={s.spotlightHead}>
                <p className={s.spotlightNameLarge}>{top.name}</p>
                {top.positionLabel && <p className={s.spotlightPosition}>{top.positionLabel}</p>}
              </div>
              <div className={s.spotlightStatsRow}>
                <div className={s.spotlightStatPair}>
                  <div className={s.spotlightStat} aria-label={t('home.spotlight.goalsLabel')}>
                    <BallIcon width={16} height={16} className={s.spotlightStatIcon} />
                    <span className={s.spotlightStatValue}>{top.goals}</span>
                  </div>
                  <div className={s.spotlightStat} aria-label={t('home.spotlight.assistsLabel')}>
                    <BootIcon width={16} height={16} className={s.spotlightStatIcon} />
                    <span className={s.spotlightStatValue}>{top.assists}</span>
                  </div>
                </div>
                {top.avgRating != null && (
                  <div
                    className={`${s.spotlightStat} ${s.spotlightStatRating}`}
                    aria-label={t('profile.header.avgRating')}
                  >
                    <StarIcon width={16} height={16} className={s.spotlightStatIcon} />
                    <span className={`${s.spotlightStatValue} ${ratingText(top.avgRating)}`}>
                      {top.avgRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <img
              src={top.posingPhotoUrl ?? PLACEHOLDER_PLAYER_PHOTO}
              alt={top.name}
              className={
                top.posingPhotoUrl
                  ? s.spotlightPhotoLarge
                  : `${s.spotlightPhotoLarge} ${s.spotlightPhotoPlaceholder}`
              }
            />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={panel.panel}>
      <div className={panel.panelHead}>
        <h2 className={panel.panelTitle}>{t(titleKey)}</h2>
        <Link to="/rankings" className={panel.panelLink}>
          {t('home.spotlight.seeAll')} <ChevronRightIcon width={14} height={14} />
        </Link>
      </div>
      {!top ? (
        <HomePanelEmpty
          icon={<StarIcon width={22} height={22} />}
          title={t('home.spotlight.empty')}
        />
      ) : (
        <Link to={`/players/${top.playerId}`} className={s.spotlightCompact}>
          <Avatar name={top.name} src={top.photoUrl} size="lg" />
          <div className={s.spotlightCompactInfo}>
            <p className={s.spotlightName}>{top.name}</p>
            {top.positionLabel && <p className={s.spotlightSubtitle}>{top.positionLabel}</p>}
          </div>
          {top.avgRating != null && (
            <div className={s.spotlightRatingBox}>
              <span className={s.spotlightRatingValue}>{top.avgRating.toFixed(1)}</span>
              <span className={s.spotlightRatingLabel}>{t('profile.header.avgRating')}</span>
            </div>
          )}
        </Link>
      )}
    </div>
  );
}
