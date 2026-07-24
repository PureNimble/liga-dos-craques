import { Avatar } from '@/shared/components/ui';
import type { CardAttribute } from '../lib/cardStats';
import s from './PlayerCard.module.css';

interface PlayerCardProps {
  name: string;
  photoUrl: string | null;
  overall: number;
  position: string;
  attributes: CardAttribute[];
  subtitle?: string | null;
}

/** Classe do escalão do cartão por overall (cor de destaque tipo FIFA). */
function tierClass(overall: number) {
  if (overall >= 85) return s.gold;
  if (overall >= 70) return s.silver;
  return s.bronze;
}

export function PlayerCard({
  name,
  photoUrl,
  overall,
  position,
  attributes,
  subtitle,
}: PlayerCardProps) {
  return (
    <div className={`${s.card} ${tierClass(overall)}`}>
      {/* brilho de topo */}
      <div aria-hidden className={s.topGlow} />

      <div className={s.head}>
        <div className={s.rating}>
          <span className={s.overall}>{overall}</span>
          <span className={s.position}>{position}</span>
          <span className={s.divider} />
        </div>
        <div className={s.avatarWrap}>
          <Avatar name={name} src={photoUrl} size="xl" className={s.avatarRing} />
        </div>
      </div>

      <div className={s.identity}>
        <p className={s.name}>{name}</p>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>

      <div className={s.attributes}>
        {attributes.map((a) => (
          <div key={a.key} className={s.attribute}>
            <span className={s.attributeValue}>{a.value}</span>
            <span className={s.attributeLabel}>{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
