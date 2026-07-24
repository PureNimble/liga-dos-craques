import { useRef, useState } from 'react';
import type { Team } from '@/types/database';
import type { GamePlayerWithProfile } from '@/features/games/hooks/gameHooks';
import { useT } from '@/shared/i18n/useT';
import { positionCode, type PitchPos } from '../lib/pitchLayout';
import s from './Pitch.module.css';

interface PitchProps {
  players: GamePlayerWithProfile[];
  bench: GamePlayerWithProfile[];
  layout: Map<string, PitchPos>;
  slots: PitchPos[];
  team: Team;
  canManage: boolean;
  canSubstitute?: boolean;
  onDrop: (playerId: string, x: number, y: number) => void;
  onSubstitute: (inId: string, outId: string) => void;
}

const CREST: Record<Team, string> = { A: s.crestA, B: s.crestB };

const firstName = (name: string | null | undefined, fallback: string) =>
  (name ?? fallback).trim().split(/\s+/)[0];

interface DragState {
  id: string;
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  nearIdx: number | null;
}

/** Interactive pitch: places starters as draggable tokens on their team's slots, with a bench for substitutions. */
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
  const { t } = useT();
  const fieldRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [subIn, setSubIn] = useState<string | null>(null);

  const maxWidthRem = Math.min(28, Math.max(14, 14 + (players.length - 1) * 2));

  const codeAt = (x: number, y: number) =>
    slots.find((s) => Math.hypot(s.x - x, s.y - y) < 3)?.code ?? positionCode(x, y);

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
      d
        ? {
            ...d,
            dx: e.clientX - d.sx,
            dy: e.clientY - d.sy,
            nearIdx: nearestIdx(e.clientX, e.clientY),
          }
        : d,
    );
  }

  function onUp() {
    if (!drag) return;
    const { id, nearIdx } = drag;
    setDrag(null);
    if (nearIdx == null) return;
    const slot = slots[nearIdx];
    const cur = layout.get(id);
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
    <div className={s.wrap} style={{ maxWidth: `${maxWidthRem}rem` }}>
      <div ref={fieldRef} className={s.field}>
        <svg className={s.lines} viewBox="0 0 100 133.33" aria-hidden focusable="false">
          <rect x="2" y="2" width="96" height="129.33" rx="2" />
          <line x1="2" y1="66.67" x2="98" y2="66.67" />
          <circle cx="50" cy="66.67" r="13.5" />
          <rect x="20" y="2" width="60" height="20" />
          <rect x="36" y="2" width="28" height="10" />
          <rect x="44" y="1" width="12" height="2" />
          <rect x="20" y="111.33" width="60" height="20" />
          <rect x="36" y="121.33" width="28" height="10" />
          <rect x="44" y="130.33" width="12" height="2" />
        </svg>

        {drag &&
          slots.map((slot, i) => {
            const near = drag.nearIdx === i;
            const isOccupied = occupied(slot, drag.id);
            return (
              <div
                key={`slot-${i}`}
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                className={`${s.slot} ${near ? s.slotNear : isOccupied ? s.slotOccupied : ''}`}
              >
                {codeAt(slot.x, slot.y)}
              </div>
            );
          })}

        {players.map((p) => {
          const at = layout.get(p.player_id) ?? { x: 50, y: 50 };
          const dragging = drag?.id === p.player_id;
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
                {codeAt(at.x, at.y)}
              </span>
              <span className={s.label}>{firstName(p.profile?.name, t('teams.fallbackName'))}</span>
            </div>
          );
        })}
      </div>

      {bench.length > 0 && (
        <div className={s.bench}>
          {subIn && (
            <p className={s.subHint}>
              {t('teams.subHint')} ·{' '}
              <button type="button" className={s.subCancel} onClick={() => setSubIn(null)}>
                {t('teams.subCancel')}
              </button>
            </p>
          )}
          <div className={s.benchRow}>
            <span className={`${s.benchDot} ${team === 'A' ? s.benchDotA : s.benchDotB}`} />
            <span className={s.benchLabel}>{t('teams.bench')}</span>
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
                    {firstName(b.profile?.name, t('teams.fallbackName'))}
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
