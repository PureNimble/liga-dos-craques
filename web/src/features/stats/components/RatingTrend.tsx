import { useLayoutEffect, useRef, useState } from 'react';
import type { RatingPoint } from '../hooks/statsHooks';
import s from './RatingTrend.module.css';

/** Rating (0-10) trend chart across games: area + line, 6.0 reference line, points, last-value label, and hover tooltip. */
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

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${yOf(p.rating)}`)
    .join(' ');
  const areaPath =
    n > 0 ? `${linePath} L ${xOf(n - 1)} ${padTop + innerH} L ${xOf(0)} ${padTop + innerH} Z` : '';

  const showRef = lo <= 6 && hi >= 6;
  const gridVals = [lo, (lo + hi) / 2, hi];
  const fmtGrid = (v: number) => (Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1));

  const X_LABEL_W = 34;
  const xLabels: number[] = [];
  if (n > 0 && innerW > 0) {
    const maxLabels = Math.max(2, Math.floor(innerW / X_LABEL_W));
    const step = Math.max(1, Math.ceil(n / maxLabels));
    for (let i = 0; i < n; i++) {
      if (i % step === 0 || i === n - 1) xLabels.push(i);
    }
  }

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
    <div ref={wrapRef} className={s.container}>
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
              <stop offset="0%" className={s.areaTop} />
              <stop offset="100%" className={s.areaBottom} />
            </linearGradient>
          </defs>

          {gridVals.map((v, i) => (
            <g key={i}>
              <line
                className={s.grid}
                x1={padX}
                x2={w - padX}
                y1={yOf(v)}
                y2={yOf(v)}
                strokeWidth={1}
              />
              <text className={s.axis} x={4} y={yOf(v) + 3} fontSize={9}>
                {fmtGrid(v)}
              </text>
            </g>
          ))}

          {showRef && (
            <line
              className={s.ref}
              x1={padX}
              x2={w - padX}
              y1={yOf(6)}
              y2={yOf(6)}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {areaPath && <path d={areaPath} fill="url(#ratingArea)" />}
          {linePath && (
            <path
              className={s.line}
              d={linePath}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {active && (
            <line
              className={s.crosshair}
              x1={xOf(hover!)}
              x2={xOf(hover!)}
              y1={padTop - 6}
              y2={padTop + innerH}
              strokeWidth={1}
            />
          )}

          {points.map((p, i) => {
            const isLast = i === n - 1;
            const isHover = hover === i;
            const r = isHover ? 5 : isLast ? 4 : 3;
            return (
              <circle
                className={s.point}
                key={p.gameId}
                cx={xOf(i)}
                cy={yOf(p.rating)}
                r={r}
                strokeWidth={2}
              />
            );
          })}

          {n > 0 && hover == null && (
            <text
              className={s.lastLabel}
              x={Math.min(w - padX, xOf(n - 1))}
              y={yOf(points[n - 1].rating) - 9}
              fontSize={11}
              fontWeight={700}
              textAnchor="end"
            >
              {points[n - 1].rating.toFixed(1)}
            </text>
          )}

          {xLabels.map((i) => (
            <text
              className={s.axis}
              key={`x-${points[i].gameId}`}
              x={xOf(i)}
              y={H - 8}
              fontSize={9}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
            >
              {points[i].label}
            </text>
          ))}
        </svg>
      )}

      {active && (
        <div className={s.tooltip} style={{ left: xOf(hover!), top: 0 }}>
          <p className={s.tooltipValue}>{active.rating.toFixed(1)}</p>
          <p className={s.tooltipLabel}>{active.label}</p>
        </div>
      )}
    </div>
  );
}
