import { useLayoutEffect, useRef, useState } from 'react';
import type { RatingPoint } from './useRatingTrend';

const LINE = '#34d399'; // emerald-400 — bom contraste na superfície escura
const AREA_TOP = 'rgba(16, 185, 129, 0.28)';
const AREA_BOT = 'rgba(16, 185, 129, 0)';

/**
 * Evolução das avaliações (0–10) por jogo — série única (change-over-time):
 * área + linha 2px, linha de referência aos 6.0, pontos, rótulo do último e
 * tooltip no hover. Largura medida para render nítido (sem distorção de escala).
 */
export function RatingTrend({ points }: { points: RatingPoint[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 156;
  const padX = 16;
  const padTop = 20;
  const padBottom = 26;
  const innerW = Math.max(0, w - padX * 2);
  const innerH = H - padTop - padBottom;

  const ratings = points.map((p) => p.rating);
  let lo = Math.max(0, Math.floor(Math.min(...ratings) - 0.5));
  let hi = Math.min(10, Math.ceil(Math.max(...ratings) + 0.5));
  if (hi - lo < 2) {
    lo = Math.max(0, lo - 1);
    hi = Math.min(10, lo + 2);
  }
  const span = hi - lo;

  const n = points.length;
  const xOf = (i: number) => padX + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const yOf = (r: number) => padTop + innerH * (1 - (r - lo) / span);

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${yOf(p.rating)}`).join(' ');
  const areaPath =
    n > 0
      ? `${linePath} L ${xOf(n - 1)} ${padTop + innerH} L ${xOf(0)} ${padTop + innerH} Z`
      : '';

  const showRef = lo <= 6 && hi >= 6;
  const gridVals = [lo, (lo + hi) / 2, hi];

  function onMove(e: React.PointerEvent) {
    if (n === 0 || w === 0) return;
    const rect = wrapRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(xOf(i) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    setHover(best);
  }

  const active = hover != null ? points[hover] : null;

  return (
    <div ref={wrapRef} className="relative w-full touch-none select-none">
      {w > 0 && (
        <svg
          width={w}
          height={H}
          viewBox={`0 0 ${w} ${H}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="ratingArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={AREA_TOP} />
              <stop offset="100%" stopColor={AREA_BOT} />
            </linearGradient>
          </defs>

          {/* Grelha recessiva */}
          {gridVals.map((v, i) => (
            <g key={i}>
              <line
                x1={padX}
                x2={w - padX}
                y1={yOf(v)}
                y2={yOf(v)}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text x={4} y={yOf(v) + 3} fill="rgba(148,163,184,0.7)" fontSize={9}>
                {v.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Referência 6.0 */}
          {showRef && (
            <line
              x1={padX}
              x2={w - padX}
              y1={yOf(6)}
              y2={yOf(6)}
              stroke="rgba(148,163,184,0.35)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {areaPath && <path d={areaPath} fill="url(#ratingArea)" />}
          {linePath && <path d={linePath} fill="none" stroke={LINE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}

          {/* Crosshair */}
          {active && (
            <line
              x1={xOf(hover!)}
              x2={xOf(hover!)}
              y1={padTop - 6}
              y2={padTop + innerH}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1}
            />
          )}

          {/* Pontos */}
          {points.map((p, i) => {
            const isLast = i === n - 1;
            const isHover = hover === i;
            const r = isHover ? 5 : isLast ? 4 : 3;
            return (
              <circle
                key={p.gameId}
                cx={xOf(i)}
                cy={yOf(p.rating)}
                r={r}
                fill={LINE}
                stroke="#131519"
                strokeWidth={2}
              />
            );
          })}

          {/* Rótulo do último valor */}
          {n > 0 && hover == null && (
            <text
              x={Math.min(w - padX, xOf(n - 1))}
              y={yOf(points[n - 1].rating) - 9}
              fill={LINE}
              fontSize={11}
              fontWeight={700}
              textAnchor="end"
            >
              {points[n - 1].rating.toFixed(1)}
            </text>
          )}

          {/* Datas no eixo x (dilui se forem muitas) */}
          {points.map((p, i) => {
            const step = n > 6 ? 2 : 1;
            if (i % step !== 0 && i !== n - 1) return null;
            return (
              <text
                key={`x-${p.gameId}`}
                x={xOf(i)}
                y={H - 8}
                fill="rgba(148,163,184,0.75)"
                fontSize={9}
                textAnchor="middle"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      )}

      {/* Tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-navy-850/95 px-2.5 py-1.5 text-center shadow-elevated"
          style={{ left: xOf(hover!), top: 0 }}
        >
          <p className="text-sm font-bold tabular-nums text-pitch-300">{active.rating.toFixed(1)}</p>
          <p className="text-[10px] text-slate-400">{active.label}</p>
        </div>
      )}
    </div>
  );
}
