import { BallIcon } from '@/shared/components/ui/icons';
import { ALL_ZONES, ZONE_COUNT, ZONE_LABELS, zoneFilled } from '../../lib/penalty/penaltyModes';
import s from './PenaltyGoal.module.css';

interface PenaltyGoalProps {
  /** Zonas já preenchidas (bitmask 0..63) do jogador em foco. */
  filled: number;
  /** Zona-alvo destacada (pen_target). */
  target?: number | null;
  /** Zona escolhida pelo organizador (pen_zones). */
  selected?: number | null;
  /** Se definido, as zonas vazias ficam selecionáveis (pen_zones). */
  onSelect?: (zone: number) => void;
  /** Se definido, mostra um botão de saltar animação no canto da relva (pen_target). */
  onSkip?: () => void;
}

const FAN_ROWS = 12;
const FANS_PER_ROW = 80;
const FAN_TONES = [s.fanA, s.fanB, s.fanC, s.fanD];

/** Bancadas com adeptos que oscilam (movimento escalonado, como uma multidão). */
function Stands() {
  return (
    <div className={s.stands} aria-hidden>
      {Array.from({ length: FAN_ROWS }, (_, r) => (
        <div key={r} className={s.fanRow}>
          {Array.from({ length: FANS_PER_ROW }, (_, i) => (
            <span
              key={i}
              className={[s.fan, FAN_TONES[(i + r) % FAN_TONES.length]].join(' ')}
              style={{ animationDelay: `${((i * 7 + r * 11) % 16) * 90}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Baliza numa cena de estádio: bancadas, painéis publicitários, rede e relva. */
export function PenaltyGoal({ filled, target, selected, onSelect, onSkip }: PenaltyGoalProps) {
  return (
    <div className={s.scene}>
      <div className={s.sky} aria-hidden />
      <span className={[s.light, s.lightL].join(' ')} aria-hidden />
      <span className={[s.light, s.lightR].join(' ')} aria-hidden />
      <Stands />
      <div className={s.billboard} aria-hidden>
        <div className={s.billboardText}>{'PELADINHAS · LIGA DOS CRAQUES · '.repeat(6)}</div>
        <div className={s.billboardShine} />
      </div>

      <div className={s.goal}>
        <div className={s.net} aria-hidden />
        <div className={s.frame} aria-hidden />
        <div className={s.grid}>
          {Array.from({ length: ZONE_COUNT }, (_, i) => {
            const on = zoneFilled(filled, i);
            const isTarget = target === i;
            const isSelected = selected === i;
            const selectable = Boolean(onSelect) && !on;
            const className = [
              s.zone,
              on ? s.zoneOn : '',
              isTarget ? s.zoneTarget : '',
              isSelected ? s.zoneSelected : '',
              selectable ? s.zonePick : '',
            ]
              .filter(Boolean)
              .join(' ');

            if (selectable) {
              return (
                <button
                  key={i}
                  type="button"
                  className={className}
                  aria-pressed={isSelected}
                  aria-label={ZONE_LABELS[i]}
                  onClick={() => onSelect?.(i)}
                >
                  <span className={s.mark}>{isSelected ? '◎' : i + 1}</span>
                </button>
              );
            }
            return (
              <div key={i} className={className} title={ZONE_LABELS[i]}>
                <span className={s.mark}>{on ? <BallIcon width="1em" height="1em" /> : i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={s.grass} aria-hidden>
        <span className={s.penaltySpot} />
      </div>
      {onSkip && (
        <button type="button" className={s.skip} onClick={onSkip} aria-label="Saltar animação">
          <svg
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 5l7 7-7 7" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </button>
      )}
      {filled === ALL_ZONES && <span className={s.complete}>Baliza completa!</span>}
    </div>
  );
}
