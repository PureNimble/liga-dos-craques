import { useRef, useState } from 'react';
import type { Team } from '@/types/database';
import type { GamePlayerWithProfile } from '@/features/games/gameHooks';
import { positionCode, type PitchPos } from './pitchLayout';
import s from './Pitch.module.css';

interface PitchProps {
  /** Titulares da equipa em campo (a que está selecionada). */
  players: GamePlayerWithProfile[];
  /** Suplentes da equipa (banco). */
  bench: GamePlayerWithProfile[];
  layout: Map<string, PitchPos>;
  /** Slots-alvo da equipa (formação escolhida ou união, na tática livre). */
  slots: PitchPos[];
  /** Equipa em campo — define a cor dos tokens. */
  team: Team;
  /** Arrastar posições / decidir lineup — só antes do arranque. */
  canManage: boolean;
  /** Substituir titular↔suplente — só com o jogo a decorrer. */
  canSubstitute?: boolean;
  /** Largar num slot: o pai move ou troca as posições. */
  onDrop: (playerId: string, x: number, y: number) => void;
  /** Substituição: suplente `inId` entra pelo titular `outId`. */
  onSubstitute: (inId: string, outId: string) => void;
}

// Classe do "crest" por equipa. Os tamanhos (círculos, slots, rótulos) escalam
// com o campo via container queries (`cqw`) — ver Pitch.module.css.
const CREST: Record<Team, string> = { A: s.crestA, B: s.crestB };

const firstName = (name?: string | null) => (name ?? 'Jogador').trim().split(/\s+/)[0];

interface DragState {
  id: string;
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  nearIdx: number | null;
}

export function Pitch({
  players,
  bench,
  layout,
  slots,
  team,
  canManage,
  canSubstitute = false,
  onDrop,
  onSubstitute,
}: PitchProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  // Suplente selecionado (à espera de escolher o titular que sai).
  const [subIn, setSubIn] = useState<string | null>(null);

  function nearestIdx(clientX: number, clientY: number) {
    const rect = fieldRef.current!.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let idx: number | null = null;
    let best = Infinity;
    slots.forEach((s, i) => {
      const d = ((s.x / 100) * rect.width - px) ** 2 + ((s.y / 100) * rect.height - py) ** 2;
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    return idx;
  }

  function onDown(e: React.PointerEvent, id: string) {
    if (!canManage) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id, dx: 0, dy: 0, sx: e.clientX, sy: e.clientY, nearIdx: null });
  }

  function onMove(e: React.PointerEvent) {
    setDrag((d) =>
      d ? { ...d, dx: e.clientX - d.sx, dy: e.clientY - d.sy, nearIdx: nearestIdx(e.clientX, e.clientY) } : d,
    );
  }

  function onUp() {
    if (!drag) return;
    const { id, nearIdx } = drag;
    setDrag(null);
    if (nearIdx == null) return;
    const slot = slots[nearIdx];
    const cur = layout.get(id);
    // Sem movimento real (mesmo slot) → não faz nada.
    if (cur && Math.hypot(cur.x - slot.x, cur.y - slot.y) < 3) return;
    onDrop(id, slot.x, slot.y);
  }

  const occupied = (pos: PitchPos, exceptId: string) =>
    players.some((p) => {
      if (p.player_id === exceptId) return false;
      const l = layout.get(p.player_id);
      return l && Math.hypot(l.x - pos.x, l.y - pos.y) < 3;
    });

  return (
    <div className={s.wrap}>
      <div ref={fieldRef} className={s.field}>
        {/* Marcações */}
        <div className={s.markings}>
          <div className={s.halfway} />
          <div className={s.centerCircle} />
          <div className={s.box} />
          <div className={s.goalTop} />
          <div className={s.goalBottom} />
        </div>

        {/* Slots-alvo enquanto arrasta */}
        {drag &&
          slots.map((slot, i) => {
            const near = drag.nearIdx === i;
            const isOccupied = occupied(slot, drag.id);
            return (
              <div
                key={`slot-${i}`}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                className={`${s.slot} ${near ? s.slotNear : isOccupied ? s.slotOccupied : ''}`}
              />
            );
          })}

        {players.map((p) => {
          const at = layout.get(p.player_id) ?? { x: 50, y: 50 };
          const dragging = drag?.id === p.player_id;
          // Alvo de substituição quando há um suplente selecionado.
          const subTarget = subIn != null;
          return (
            <div
              key={p.id}
              onPointerDown={(e) => !subIn && onDown(e, p.player_id)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onClick={() => {
                if (subTarget) {
                  onSubstitute(subIn!, p.player_id);
                  setSubIn(null);
                }
              }}
              style={{
                left: `${at.x}%`,
                top: `${at.y}%`,
                transform: dragging
                  ? `translate(-50%, -50%) translate(${drag!.dx}px, ${drag!.dy}px)`
                  : 'translate(-50%, -50%)',
              }}
              className={`${s.token} ${
                subTarget ? s.tokenPointer : canManage ? s.tokenGrab : ''
              } ${dragging ? s.tokenDragging : ''}`}
            >
              <span className={`${s.crest} ${CREST[team]} ${subTarget ? s.crestSub : ''}`}>
                {positionCode(at.x, at.y)}
              </span>
              <span className={s.label}>{firstName(p.profile?.name)}</span>
            </div>
          );
        })}
      </div>

      {/* Banco (suplentes) */}
      {bench.length > 0 && (
        <div className={s.bench}>
          {subIn && (
            <p className={s.subHint}>
              Escolhe o titular que sai (toca num jogador em campo) ·{' '}
              <button type="button" className={s.subCancel} onClick={() => setSubIn(null)}>
                cancelar
              </button>
            </p>
          )}
          <div className={s.benchRow}>
            <span className={`${s.benchDot} ${team === 'A' ? s.benchDotA : s.benchDotB}`} />
            <span className={s.benchLabel}>Banco</span>
            <div className={s.benchList}>
              {bench.map((b) => {
                const selected = subIn === b.player_id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={!canSubstitute}
                    onClick={() => setSubIn(selected ? null : b.player_id)}
                    className={`${s.benchBtn} ${selected ? s.benchBtnActive : ''}`}
                  >
                    {firstName(b.profile?.name)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
