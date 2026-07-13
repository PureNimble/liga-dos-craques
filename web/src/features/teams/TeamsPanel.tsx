import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Select } from '@/shared/components/ui';
import type { GamePlayerWithProfile } from '@/features/games/gameHooks';
import type { Team } from '@/types/database';
import {
  usePlayerRatings,
  useAssignTeams,
  useSetPlayerTeam,
  useAutoFillPositions,
  useAssignLineup,
  useSubstitute,
} from './teamHooks';
import { balanceTeams, type BalancePlayer } from './teamBalancer';
import { Pitch } from './Pitch';
import {
  buildLayout,
  defaultFormation,
  formationsFor,
  slotsFor,
  unionSlots,
  type Formation,
  type PitchPos,
} from './pitchLayout';

const CUSTOM = '__custom__';

interface TeamsPanelProps {
  gameId: string;
  players: GamePlayerWithProfile[];
  /** Decidir equipas (gerar, mover entre A/B, arrastar, formação) — só antes do arranque. */
  canManage: boolean;
  /** Substituir titular↔suplente — só com o jogo a decorrer. */
  canSubstitute?: boolean;
  canGenerate: boolean;
  /** Jogadores por lado do FORMATO — é o máximo; menos jogadores → lado menor. */
  playersPerSide: number;
  /** Minuto atual (para o evento de substituição). */
  currentMinute?: number;
}

export function TeamsPanel({
  gameId,
  players,
  canManage,
  canSubstitute = false,
  canGenerate,
  playersPerSide,
  currentMinute = 0,
}: TeamsPanelProps) {
  const ids = players.map((p) => p.player_id);
  const { data: ratings } = usePlayerRatings(ids);
  const assignTeams = useAssignTeams(gameId);
  const setPlayerTeam = useSetPlayerTeam(gameId);
  const persist = useAutoFillPositions(gameId);
  const assignLineup = useAssignLineup(gameId);
  const substitute = useSubstitute(gameId);

  const ratingOf = (playerId: string) => Math.round(ratings?.get(playerId)?.rating ?? 50);
  const categoryOf = (playerId: string) => ratings?.get(playerId)?.category ?? null;

  const teamA = players.filter((p) => p.team === 'A');
  const teamB = players.filter((p) => p.team === 'B');
  const startersA = teamA.filter((p) => p.on_field);
  const startersB = teamB.filter((p) => p.on_field);
  const benchA = teamA.filter((p) => !p.on_field);
  const benchB = teamB.filter((p) => !p.on_field);
  const unassigned = players.filter((p) => !p.team);
  const hasTeams = teamA.length > 0 || teamB.length > 0;

  // O formato é o MÁXIMO por lado; cada equipa usa a sua dimensão real (limitada
  // ao formato). Ex.: num 3v3 com 5 jogadores → 3 vs 2, cada um com a sua tática.
  const sizeA = Math.min(teamA.length, playersPerSide) || 1;
  const sizeB = Math.min(teamB.length, playersPerSide) || 1;
  const sizeOf = (team: Team) => (team === 'A' ? sizeA : sizeB);

  // Equipa em campo (o switch alterna entre A e B, estilo app de resultados).
  const [selectedTeam, setSelectedTeam] = useState<Team>('A');

  // Formação escolhida por equipa (por nome; default se não escolhida / inválida).
  const [formNameA, setFormNameA] = useState<string | null>(null);
  const [formNameB, setFormNameB] = useState<string | null>(null);
  const [override, setOverride] = useState<Map<string, PitchPos>>(new Map());

  const resolveForm = (name: string | null, size: number): Formation =>
    formationsFor(size).find((f) => f.name === name) ?? defaultFormation(size);
  const formA = resolveForm(formNameA, sizeA);
  const formB = resolveForm(formNameB, sizeB);

  // Slots-alvo: da formação escolhida, ou a grelha completa 11v11 (tática livre).
  const slotsA = formNameA === CUSTOM ? unionSlots() : slotsFor(formA);
  const slotsB = formNameB === CUSTOM ? unionSlots() : slotsFor(formB);

  // Layout dos titulares: formação base + posições guardadas + otimista da sessão.
  const layout = useMemo(() => {
    const m = new Map<string, PitchPos>();
    buildLayout(startersA.map((p) => p.player_id), formA, categoryOf).forEach((v, k) => m.set(k, v));
    buildLayout(startersB.map((p) => p.player_id), formB, categoryOf).forEach((v, k) => m.set(k, v));
    for (const p of players) {
      if (p.on_field && p.pos_x != null && p.pos_y != null) m.set(p.player_id, { x: p.pos_x, y: p.pos_y });
    }
    override.forEach((v, k) => m.set(k, v));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, formA, formB, override, ratings]);

  const sum = (list: GamePlayerWithProfile[]) => list.reduce((acc, p) => acc + ratingOf(p.player_id), 0);

  function generate() {
    const input: BalancePlayer[] = players.map((p) => ({
      id: p.player_id,
      rating: ratings?.get(p.player_id)?.rating ?? 50,
      category: ratings?.get(p.player_id)?.category ?? null,
    }));
    const { a, b } = balanceTeams(input);
    assignTeams.mutate({ a, b });
  }

  function persistLayout(entries: Map<string, PitchPos>) {
    const next = new Map(override);
    const payload: { playerId: string; x: number; y: number }[] = [];
    entries.forEach((pos, id) => {
      next.set(id, pos);
      payload.push({ playerId: id, x: pos.x, y: pos.y });
    });
    setOverride(next);
    if (payload.length) persist.mutate(payload);
  }

  // Largar um jogador num slot da sua equipa. Ocupado → troca posições; vazio → move.
  function drop(id: string, x: number, y: number) {
    const dragged = players.find((p) => p.player_id === id);
    if (!dragged) return;
    const occupant = players.find((p) => {
      if (p.player_id === id || p.team !== dragged.team) return false;
      const l = layout.get(p.player_id);
      return l != null && Math.hypot(l.x - x, l.y - y) < 4;
    });
    if (occupant) {
      const pa = layout.get(id);
      const pb = layout.get(occupant.player_id);
      if (pa && pb) persistLayout(new Map([[id, pb], [occupant.player_id, pa]]));
    } else {
      persistLayout(new Map([[id, { x, y }]]));
    }
  }

  function pickFormation(team: Team, name: string) {
    if (name === CUSTOM) {
      // Tática livre: mantém as posições atuais, só alarga os slots disponíveis.
      if (team === 'A') setFormNameA(CUSTOM);
      else setFormNameB(CUSTOM);
      return;
    }
    const f = formationsFor(sizeOf(team)).find((o) => o.name === name);
    if (!f) return;
    const starters = team === 'A' ? startersA : startersB;
    if (team === 'A') setFormNameA(f.name);
    else setFormNameB(f.name);
    persistLayout(buildLayout(starters.map((p) => p.player_id), f, categoryOf));
  }

  // Define titulares (os melhores por equipa, até à dimensão) + suplentes + posições.
  function autoFill() {
    const rows: { playerId: string; on_field: boolean; x?: number; y?: number }[] = [];
    for (const team of ['A', 'B'] as Team[]) {
      const size = sizeOf(team);
      const f = defaultFormation(size);
      if (team === 'A') setFormNameA(f.name);
      else setFormNameB(f.name);
      const list = team === 'A' ? teamA : teamB;
      const sorted = [...list].sort((a, b) => ratingOf(b.player_id) - ratingOf(a.player_id));
      const starters = sorted.slice(0, size);
      const bench = sorted.slice(size);
      const pos = buildLayout(starters.map((p) => p.player_id), f, categoryOf);
      for (const s of starters) {
        const p = pos.get(s.player_id);
        rows.push({ playerId: s.player_id, on_field: true, x: p?.x, y: p?.y });
      }
      for (const b of bench) rows.push({ playerId: b.player_id, on_field: false });
    }
    setOverride(new Map());
    if (rows.length) assignLineup.mutate(rows);
  }

  // Substituição: suplente (in) entra pelo titular (out).
  function doSubstitute(inId: string, outId: string) {
    setOverride(new Map());
    const outName = players.find((p) => p.player_id === outId)?.profile?.name ?? undefined;
    const team = players.find((p) => p.player_id === outId)?.team ?? null;
    substitute.mutate({ inId, outId, outName, team: team as Team | null, minute: currentMinute });
  }

  // Ao formar equipas com suplentes, define o onze inicial uma única vez.
  const didInitLineup = useRef(false);
  useEffect(() => {
    if (!canManage || didInitLineup.current || !ratings) return;
    const excess = startersA.length > sizeA || startersB.length > sizeB;
    if (excess) {
      didInitLineup.current = true;
      autoFill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, ratings, teamA.length, teamB.length, sizeA, sizeB]);

  const selStarters = selectedTeam === 'A' ? startersA : startersB;
  const selBench = selectedTeam === 'A' ? benchA : benchB;
  const selSlots = selectedTeam === 'A' ? slotsA : slotsB;
  const selSize = sizeOf(selectedTeam);
  const selFormName = selectedTeam === 'A' ? formNameA ?? formA.name : formNameB ?? formB.name;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-slate-100">Equipas</h2>
        {canManage && canGenerate && (
          <Button variant="secondary" size="sm" onClick={generate} loading={assignTeams.isPending}>
            {hasTeams ? 'Regenerar' : 'Gerar equipas'}
          </Button>
        )}
      </div>

      {assignTeams.isError && (
        <div className="mb-3">
          <Alert kind="error">Não foi possível gerar as equipas.</Alert>
        </div>
      )}

      {!hasTeams ? (
        <p className="text-sm text-slate-400">
          {canManage && canGenerate
            ? 'Ainda não há equipas. Gera equipas equilibradas automaticamente.'
            : 'As equipas ainda não foram geradas.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Switch entre equipas (estilo app de resultados) */}
          <div className="flex rounded-xl border border-navy-800 bg-navy-950 p-1">
            {(['A', 'B'] as Team[]).map((t) => {
              const active = selectedTeam === t;
              const activeBg = t === 'A' ? 'bg-pitch-500 text-navy-975' : 'bg-sky-500 text-navy-975';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTeam(t)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    active ? activeBg : 'text-slate-300 hover:bg-navy-900'
                  }`}
                >
                  {!active && (
                    <span className={`h-2 w-2 rounded-full ${t === 'A' ? 'bg-pitch-500' : 'bg-sky-500'}`} />
                  )}
                  Equipa {t}
                  <span className="tabular-nums opacity-80">{sum(t === 'A' ? teamA : teamB)}</span>
                </button>
              );
            })}
          </div>

          <Pitch
            players={selStarters}
            bench={selBench}
            layout={layout}
            slots={selSlots}
            team={selectedTeam}
            canManage={canManage}
            canSubstitute={canSubstitute}
            onDrop={drop}
            onSubstitute={doSubstitute}
          />

          {canManage && (
            <>
              <div className="flex items-end justify-between gap-2">
                <FormationSelect
                  label={`Formação · Equipa ${selectedTeam}`}
                  dot={selectedTeam === 'A' ? 'bg-pitch-500' : 'bg-sky-500'}
                  value={selFormName}
                  size={selSize}
                  onChange={(n) => pickFormation(selectedTeam, n)}
                />
                <Button variant="secondary" size="sm" onClick={autoFill} loading={persist.isPending}>
                  Auto-preencher
                </Button>
              </div>
              <p className="text-center text-xs text-slate-500">ou arrasta um jogador para mover ou trocar</p>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <TeamColumn
              title="Equipa A"
              total={sum(teamA)}
              list={teamA}
              ratingOf={ratingOf}
              canManage={canManage}
              onMove={(playerId) => setPlayerTeam.mutate({ playerId, team: 'B' })}
              moveLabel="→ B"
            />
            <TeamColumn
              title="Equipa B"
              total={sum(teamB)}
              list={teamB}
              ratingOf={ratingOf}
              canManage={canManage}
              onMove={(playerId) => setPlayerTeam.mutate({ playerId, team: 'A' })}
              moveLabel="→ A"
            />
          </div>
        </div>
      )}

      {hasTeams && (
        <p className="mt-2 text-center text-xs text-slate-500">
          Diferença de rating: {Math.abs(sum(teamA) - sum(teamB))}
        </p>
      )}

      {/* Jogadores por atribuir */}
      {unassigned.length > 0 && (
        <div className="mt-4 border-t border-navy-800 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-400">Por atribuir</p>
          <ul className="flex flex-col gap-1">
            {unassigned.map((p) => (
              <li key={p.player_id} className="flex items-center justify-between text-sm">
                <span>
                  {p.profile?.name ?? 'Jogador'}{' '}
                  <span className="text-slate-500">({ratingOf(p.player_id)})</span>
                </span>
                {canManage && (
                  <span className="flex gap-2">
                    <button
                      onClick={() => setPlayerTeam.mutate({ playerId: p.player_id, team: 'A' })}
                      className="text-xs text-pitch-400 hover:underline"
                    >
                      + A
                    </button>
                    <button
                      onClick={() => setPlayerTeam.mutate({ playerId: p.player_id, team: 'B' })}
                      className="text-xs text-pitch-400 hover:underline"
                    >
                      + B
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function FormationSelect({
  label,
  dot,
  value,
  size,
  onChange,
}: {
  label: string;
  dot: string;
  value: string;
  size: number;
  onChange: (name: string) => void;
}) {
  const options = formationsFor(size);
  return (
    <label className="flex-1 text-xs text-slate-400">
      <span className="mb-1 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dot}`} /> {label}
      </span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.name} value={o.name}>
            {o.name}
          </option>
        ))}
        <option value={CUSTOM}>Personalizada</option>
      </Select>
    </label>
  );
}

function TeamColumn({
  title,
  total,
  list,
  ratingOf,
  canManage,
  onMove,
  moveLabel,
}: {
  title: string;
  total: number;
  list: GamePlayerWithProfile[];
  ratingOf: (id: string) => number;
  canManage: boolean;
  onMove: (playerId: string) => void;
  moveLabel: string;
}) {
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-950 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-100">{title}</p>
        <span className="rounded-full bg-navy-800 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-300">
          {total}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {list.map((p) => (
          <li key={p.player_id} className="flex items-center justify-between text-sm">
            <span>
              {p.profile?.name ?? 'Jogador'}{' '}
              <span className="text-slate-500">({ratingOf(p.player_id)})</span>
            </span>
            {canManage && (
              <button
                onClick={() => onMove(p.player_id)}
                className="text-xs text-slate-400 hover:text-slate-200 hover:underline"
              >
                {moveLabel}
              </button>
            )}
          </li>
        ))}
        {list.length === 0 && <li className="text-xs text-slate-500">—</li>}
      </ul>
    </div>
  );
}
