import { useEffect, useRef, useState } from 'react';
import type { IconicGoal } from '../../hooks/iconic/iconicGoalHooks';
import { playLand, playTick, startSpin, stopSpin } from '../../lib/iconic/spinnerSound';
import s from './IconicSpinner.module.css';

/** Altura de cada carta (px) — tem de bater certo com a moldura no CSS. */
const CARD_H = 88;

/** Duração do deslize — partilhada entre a transição CSS e o whir do som. */
const SPIN_S = 4.2;

/** Intervalo mínimo entre ticks: na fase rápida passam centenas de cartas por
    segundo, que soariam a ruído em vez de cliques distintos. */
const MIN_TICK_MS = 45;

/** Deslocamento vertical atual do carrossel (lê o transform já interpolado). */
function currentTranslateY(el: HTMLElement): number {
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 0;
  return new DOMMatrixReadOnly(t).m42;
}

interface IconicSpinnerProps {
  items: IconicGoal[];
  targetIndex: number;
  spinning: boolean;
  /** Muda a cada rodada nova → dispara a animação. */
  spinKey: string;
  onDone?: () => void;
}

/** Carrossel vertical estilo Forza Wheelspin: rola e assenta no golo-alvo. */
export function IconicSpinner({ items, targetIndex, spinning, spinKey, onDone }: IconicSpinnerProps) {
  const rest = -(targetIndex - 1) * CARD_H;
  const [offset, setOffset] = useState(rest);
  const [animate, setAnimate] = useState(false);
  const reelRef = useRef<HTMLDivElement>(null);

  // Toca um tick a cada carta que passa pelo centro, enquanto roda.
  useEffect(() => {
    const el = reelRef.current;
    if (!spinning || !el) return;
    let raf = 0;
    let lastIndex = -1;
    let lastAt = 0;
    function step() {
      const index = Math.floor(-currentTranslateY(el!) / CARD_H);
      if (lastIndex < 0) {
        lastIndex = index;
      } else if (index > lastIndex) {
        // A última carta fica reservada ao som de aterragem (ver onTransitionEnd).
        const now = performance.now();
        if (index < targetIndex - 1 && now - lastAt >= MIN_TICK_MS) {
          playTick();
          lastAt = now;
        }
        lastIndex = index;
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [spinKey, spinning, targetIndex]);

  useEffect(() => {
    if (!spinning) {
      setAnimate(false);
      setOffset(-(targetIndex - 1) * CARD_H);
      return;
    }
    // Recomeça no topo (sem transição) e, no frame seguinte, desliza até ao alvo.
    setAnimate(false);
    setOffset(0);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setAnimate(true);
        setOffset(-(targetIndex - 1) * CARD_H);
        startSpin(SPIN_S);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      stopSpin();
    };
  }, [spinKey, spinning, targetIndex]);

  if (items.length === 0) return null;

  return (
    <div className={s.window} style={{ height: CARD_H * 3 }}>
      <div className={s.fadeTop} />
      <div className={s.fadeBottom} />
      <span className={s.arrowL} />
      <span className={s.arrowR} />
      <div className={s.centerFrame} />
      <div
        ref={reelRef}
        className={s.reel}
        style={{
          transform: `translateY(${offset}px)`,
          transition: animate
            ? `transform ${SPIN_S}s cubic-bezier(0.11, 0.75, 0.16, 1)`
            : 'none',
        }}
        onTransitionEnd={
          spinning
            ? () => {
                stopSpin();
                playLand();
                onDone?.();
              }
            : undefined
        }
      >
        {items.map((g, i) => (
          <div key={i} className={s.card} style={{ height: CARD_H }}>
            <span className={s.cardScorer}>{g.scorer}</span>
            <span className={s.cardTitle}>{g.title}</span>
            <DifficultyPips value={g.difficulty} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dificuldade 1–5 em pontos preenchidos. */
export function DifficultyPips({ value }: { value: number }) {
  return (
    <span className={s.pips} aria-label={`Dificuldade ${value} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`${s.pip} ${i < value ? s.pipOn : ''}`} />
      ))}
    </span>
  );
}
