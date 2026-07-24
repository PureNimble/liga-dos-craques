import { useEffect, useState, type CSSProperties } from 'react';
import { Avatar, IconButton } from '@/shared/components/ui';
import { EditIcon } from '@/shared/components/ui/icons';
import type { PlayerXp } from '@/features/xp/hooks/xpHooks';
import type { CardAttribute } from '../lib/cardStats';
import { AttributeRadar } from './AttributeRadar';
import s from './PlayerCard.module.css';
import { useT } from '@/shared/i18n/useT';

interface PlayerCardProps {
  name: string;
  photoUrl: string | null;
  overall: number;
  position: string;
  attributes: CardAttribute[];
  subtitle?: string | null;
  xp?: PlayerXp | null;
  onEdit?: () => void;
}

const RING_SIZE = 96;
const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Progress (0-100) toward the next level; with no XP loaded, the ring stays empty. */
function xpProgress(xp: PlayerXp | null | undefined) {
  if (!xp) return 0;
  if (xp.next_level_xp === null) return 100;
  const span = xp.next_level_xp - xp.level_min_xp;
  const gained = xp.total_xp - xp.level_min_xp;
  return Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
}

/** Counts up to `target` with cubic easing; jumps straight to the end under reduced-motion. */
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/** Player card: identity, overall and attribute radar in a single row. */
export function PlayerCard({
  name,
  photoUrl,
  overall,
  position,
  attributes,
  subtitle,
  xp,
  onEdit,
}: PlayerCardProps) {
  const pct = xpProgress(xp);
  const dashOffset = RING_CIRCUMFERENCE * (1 - pct / 100);
  const shownOverall = useCountUp(overall);
  const { t } = useT();

  return (
    <div className={s.card}>
      <div aria-hidden className={s.topGlow} />

      <div className={s.row}>
        <div className={s.identity}>
          {onEdit && (
            <IconButton label={t('profile.editProfile')} onClick={onEdit} className={s.editButton}>
              <EditIcon width={16} height={16} />
            </IconButton>
          )}
          <div className={s.identityTop}>
            <div className={s.ringWrap}>
              <svg
                aria-hidden
                className={s.ring}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                width={RING_SIZE}
                height={RING_SIZE}
              >
                <circle
                  className={s.ringTrack}
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                />
                <circle
                  className={s.ringProgress}
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  style={{ '--ring-circ': RING_CIRCUMFERENCE } as CSSProperties}
                />
              </svg>
              <Avatar name={name} src={photoUrl} size="xl" className={s.avatar} />
              {xp && (
                <span className={s.levelBadge} title={`Nível ${xp.level}`}>
                  {xp.level}
                </span>
              )}
            </div>
            <div
              className={onEdit ? `${s.identityText} ${s.identityTextWithEdit}` : s.identityText}
            >
              <p className={s.name}>{name}</p>
              {subtitle && <p className={s.subtitle}>{subtitle}</p>}
            </div>
            <div className={s.overallMini}>
              <span className={s.overallMiniValue}>{shownOverall}</span>
              <span className={s.positionBadge}>{position}</span>
            </div>
          </div>
        </div>

        <div className={s.divider} />

        <div className={s.overallBlock}>
          <span className={s.overallValue}>{shownOverall}</span>
          <span className={s.overallLabel}>{t('profile.overall')}</span>
          <span className={s.positionBadge}>{position}</span>
        </div>

        <div className={s.divider} />

        <div className={s.radarBlock}>
          <h3 className={s.radarLabel}>{t('profile.attributes')}</h3>
          <AttributeRadar attributes={attributes} />
        </div>
      </div>
    </div>
  );
}
