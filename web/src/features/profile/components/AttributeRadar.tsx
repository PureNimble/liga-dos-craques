import { useT } from '@/shared/i18n/useT';
import type { CardAttribute } from '../lib/cardStats';
import s from './AttributeRadar.module.css';

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 92;
const RINGS = [0.33, 0.66, 1];
/** Escala dos atributos (ver cardStats.ts): nunca passam disto. */
const MAX_VALUE = 99;

function pointAt(index: number, count: number, fraction: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return {
    x: CENTER + Math.cos(angle) * RADIUS * fraction,
    y: CENTER + Math.sin(angle) * RADIUS * fraction,
  };
}

function polygonPoints(count: number, fraction: number) {
  return Array.from({ length: count }, (_, i) => {
    const p = pointAt(i, count, fraction);
    return `${p.x},${p.y}`;
  }).join(' ');
}

/** Radar dos atributos do cartão (FIN/ASS/DEF/VIT/EXP/MVP) - série única, à mão em SVG. */
export function AttributeRadar({ attributes }: { attributes: CardAttribute[] }) {
  const { t } = useT();
  const n = attributes.length;
  if (n < 3) return null;

  const dataPoints = attributes.map((a, i) => pointAt(i, n, a.value / MAX_VALUE));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      className={s.svg}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Radar de atributos do jogador"
    >
      {/* Grelha recessiva: anéis concêntricos + raios até cada eixo. */}
      {RINGS.map((fraction) => (
        <polygon key={fraction} className={s.ring} points={polygonPoints(n, fraction)} />
      ))}
      {attributes.map((a, i) => {
        const p = pointAt(i, n, 1);
        return <line key={a.key} className={s.spoke} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} />;
      })}

      {/* Série do jogador */}
      <polygon className={s.area} points={dataPath} />
      <polygon className={s.line} points={dataPath} />
      {dataPoints.map((p, i) => (
        <circle key={attributes[i].key} className={s.point} cx={p.x} cy={p.y} r={3} />
      ))}

      {/* Rótulos + valor (selo), fora do anel maior */}
      {attributes.map((a, i) => {
        const p = pointAt(i, n, 1.28);
        const anchor = Math.abs(p.x - CENTER) < 4 ? 'middle' : p.x > CENTER ? 'start' : 'end';
        const dx = anchor === 'start' ? 1 : anchor === 'end' ? -1 : 0;
        const badgeW = 24;
        const badgeCx = p.x + dx * (badgeW / 2 + 2);
        return (
          <g key={a.key}>
            <rect
              className={s.badge}
              x={badgeCx - badgeW / 2}
              y={p.y - 20}
              width={badgeW}
              height={16}
              rx={8}
            />
            <text className={s.badgeText} x={badgeCx} y={p.y - 9} textAnchor="middle">
              {a.value}
            </text>
            <text className={s.label} x={p.x} y={p.y + 12} textAnchor={anchor}>
              {t(a.fullLabelKey)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
