import { Link } from 'react-router-dom';
import { PinIcon, ChevronRightIcon, BallIcon, TrophyIcon, TargetIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import s from './HomeQuickActions.module.css';

/** Quick-access tiles into the games, rankings, challenges and places screens. */
export function HomeQuickActions() {
  const { t } = useT();
  const actions = [
    { to: '/games', label: t('home.quick.games'), subtitle: t('home.quick.games.subtitle'), icon: BallIcon },
    {
      to: '/rankings',
      label: t('home.quick.rankings'),
      subtitle: t('home.quick.rankings.subtitle'),
      icon: TrophyIcon,
    },
    {
      to: '/challenges',
      label: t('home.quick.challenges'),
      subtitle: t('home.quick.challenges.subtitle'),
      icon: TargetIcon,
    },
    {
      to: '/places',
      label: t('home.quick.places'),
      subtitle: t('home.quick.places.subtitle'),
      icon: PinIcon,
    },
  ];
  return (
    <div className={s.tiles}>
      {actions.map((a) => (
        <Link key={a.to} to={a.to} className={s.tile}>
          <span className={s.tileIcon}>
            <a.icon width={20} height={20} />
          </span>
          <span className={s.tileBody}>
            <span className={s.tileLabel}>{a.label}</span>
            <span className={s.tileSubtitle}>{a.subtitle}</span>
          </span>
          <ChevronRightIcon width={16} height={16} className={s.tileChevron} />
        </Link>
      ))}
    </div>
  );
}
