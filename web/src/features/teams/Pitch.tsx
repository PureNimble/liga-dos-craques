import { useRef, useState } from 'react';
import type { Team } from '@/types/database';
import type { GamePlayerWithProfile } from '@/features/games/gameHooks';
import { positionCode, type PitchPos } from './pitchLayout';

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

const TEAM_TOKEN: Record<Team, string> = {
  A: 'bg-pitch-500 text-navy-975 ring-pitch-300/50',
  B: 'bg-sky-500 text-navy-975 ring-sky-300/50',
};

const firstName = (name?: string | null) => (name ?? 'Jogador').trim().split(/\s+/)[0];

// Tamanhos relativos AO CAMPO (container queries): `cqw` = 1% da largura do
// campo, por isso os círculos, slots e rótulos escalam com o campo e mantêm a
// mesma proporção em qualquer ecrã (nunca ficam "colados" num campo pequeno).
// O clamp garante um mínimo legível e um máximo igual ao tamanho original.
const TOKEN_SIZE = 'h-[clamp(1.4rem,8.5cqw,2.25rem)] w-[clamp(1.4rem,8.5cqw,2.25rem)]';
const SLOT_SIZE = 'h-[clamp(1.6rem,9.5cqw,2.5rem)] w-[clamp(1.6rem,9.5cqw,2.5rem)]';
const TOKEN_TEXT = 'text-[clamp(0.5rem,2.4cqw,0.625rem)]';

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
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <div
        ref={fieldRef}
        className="turf relative @container aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-2xl border border-white/10 shadow-elevated"
      >
        {/* Marcações */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/25" />
          <div className="absolute left-1/2 top-1/2 h-[18cqw] w-[18cqw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
          <div className="absolute inset-2 rounded-lg border border-white/15" />
          <div className="absolute left-1/2 top-0 h-[14%] w-[52%] -translate-x-1/2 rounded-b-md border border-t-0 border-white/20" />
          <div className="absolute bottom-0 left-1/2 h-[14%] w-[52%] -translate-x-1/2 rounded-t-md border border-b-0 border-white/20" />
        </div>

        {/* Slots-alvo enquanto arrasta */}
        {drag &&
          slots.map((s, i) => {
            const near = drag.nearIdx === i;
            const isOccupied = occupied(s, drag.id);
            return (
              <div
                key={`slot-${i}`}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                className={`pointer-events-none absolute z-0 ${SLOT_SIZE} -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed transition ${
                  near
                    ? 'scale-125 border-white bg-white/20'
                    : isOccupied
                      ? 'border-white/25'
                      : 'border-white/45 bg-white/5'
                }`}
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
              className={`absolute ${TOKEN_SIZE} ${
                subTarget ? 'cursor-pointer' : canManage ? 'cursor-grab active:cursor-grabbing' : ''
              } ${dragging ? 'z-20 scale-110' : 'z-10 transition-[left,top] duration-300'}`}
            >
              <span
                className={`flex ${TOKEN_SIZE} items-center justify-center rounded-full ${TOKEN_TEXT} font-black uppercase shadow-md ring-2 ${
                  TEAM_TOKEN[team]
                } ${subTarget ? 'animate-pulse ring-white' : ''}`}
              >
                {positionCode(at.x, at.y)}
              </span>
              <span className="absolute left-1/2 top-full mt-0.5 max-w-[16cqw] -translate-x-1/2 truncate rounded bg-black/50 px-1 text-[clamp(0.5rem,2.4cqw,0.625rem)] font-medium leading-tight text-white">
                {firstName(p.profile?.name)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Banco (suplentes) */}
      {bench.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {subIn && (
            <p className="text-center text-xs font-medium text-pitch-400">
              Escolhe o titular que sai (toca num jogador em campo) ·{' '}
              <button type="button" className="underline" onClick={() => setSubIn(null)}>
                cancelar
              </button>
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${team === 'A' ? 'bg-pitch-500' : 'bg-sky-500'}`} />
            <span className="w-14 shrink-0 text-[11px] font-semibold text-slate-400">Banco</span>
            <div className="flex flex-wrap gap-1.5">
              {bench.map((b) => {
                const selected = subIn === b.player_id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={!canSubstitute}
                    onClick={() => setSubIn(selected ? null : b.player_id)}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition ${
                      selected
                        ? 'border-pitch-500 bg-pitch-500 text-navy-975 shadow-glow'
                        : 'border-navy-700 bg-navy-850 text-slate-200 hover:bg-navy-800'
                    }`}
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
