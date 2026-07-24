import type { Position } from '../hooks/profileHooks';
import { PITCH_H, stateOf, xyFor, type PositionSelection } from '../lib/positionPitch';
import s from './PositionPicker.module.css';

interface PositionPickerProps {
  positions: Position[];
  value: PositionSelection;
  onToggle: (id: number) => void;
}

/** Meio-campo onde se escolhe a posição principal e as secundárias. */
export function PositionPicker({ positions, value, onToggle }: PositionPickerProps) {
  return (
    <div className={s.wrap}>
      <div className={s.pitch}>
        {/* Decorativo: quem se lê são os botões. */}
        <svg className={s.lines} viewBox={`0 0 100 ${PITCH_H}`} aria-hidden focusable="false">
          <rect x="2" y="2" width="96" height={PITCH_H - 4} rx="2" />
          {/* Grande e pequena área, à volta da baliza própria. */}
          <rect x="20" y="54" width="60" height="24" />
          <rect x="36" y="70" width="28" height="8" />
          {/* Baliza. */}
          <rect x="44" y="77" width="12" height="2" />
          {/* Arco do meio-campo. */}
          <path d="M 36.5 2 A 13.5 13.5 0 0 0 63.5 2" />
        </svg>

        {positions.map((p) => {
          const xy = xyFor(p.code);
          if (!xy) return null;
          const st = stateOf(value, p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              aria-pressed={st !== 'none'}
              aria-label={st === 'main' ? `${p.label} (principal)` : p.label}
              title={p.label}
              className={[
                s.spot,
                st === 'main' ? s.main : '',
                st === 'secondary' ? s.secondary : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ left: `${xy.x}%`, top: `${(xy.y / PITCH_H) * 100}%` }}
            >
              {p.code}
            </button>
          );
        })}
      </div>

      <p className={s.help}>
        Toca para escolher. A primeira fica <strong className={s.helpMain}>principal</strong>; as
        outras <strong className={s.helpSecondary}>secundárias</strong>. Tocar numa secundária
        torna-a principal; tocar na principal tira-a.
      </p>
    </div>
  );
}
