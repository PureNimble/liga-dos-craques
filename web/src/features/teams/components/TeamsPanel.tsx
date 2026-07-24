import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Select } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import type { GamePlayerWithProfile } from '@/features/games/hooks/gameHooks';
import type { Team } from '@/types/database';
import {
  usePlayerRatings,
  useAssignTeams,
  useSetPlayerTeam,
  useAutoFillPositions,
  useAssignLineup,
  useSubstitute,
} from '../hooks/teamHooks';
import { balanceTeams, type BalancePlayer } from '../lib/teamBalancer';
import { Pitch } from './Pitch';
import s from './TeamsPanel.module.css';
import {
  buildLayout,
  defaultFormation,
  formationsFor,
  slotsFor,
  unionSlots,
  type Formation,
  type PitchPos,
} from '../lib/pitchLayout';

const CUSTOM = '__custom__';

interface TeamsPanelProps {
  gameId: string;
  players: GamePlayerWithProfile[];
  canManage: boolean;
  canSubstitute?: boolean;
  canGenerate: boolean;
  playersPerSide: number;
  currentMinute?: number;
}

/** Team formation panel: generate/assign teams, pick formations, drag lineups on the pitch, and handle substitutions. */
export function TeamsPanel({
  gameId,
  players,
  canManage,
  canSubstitute = false,
  canGenerate,
  playersPerSide,
  currentMinute = 0,
}: TeamsPanelProps) {
  const { t } = useT();
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

  const sizeA = Math.min(teamA.length, playersPerSide) || 1;
  const sizeB = Math.min(teamB.length, playersPerSide) || 1;
  const sizeOf = (team: Team) => (team === 'A' ? sizeA : sizeB);

  const [selectedTeam, setSelectedTeam] = useState<Team>('A');

  const [formNameA, setFormNameA] = useState<string | null>(null);
  const [formNameB, setFormNameB] = useState<string | null>(null);
  const [override, setOverride] = useState<Map<string, PitchPos>>(new Map());

  const resolveForm = (name: string | null, size: number): Formation =>
    formationsFor(size).find((f) => f.name === name) ?? defaultFormation(size);
  const formA = resolveForm(formNameA, sizeA);
  const formB = resolveForm(formNameB, sizeB);

  const slotsA = formNameA === CUSTOM ? unionSlots() : slotsFor(formA);
  const slotsB = formNameB === CUSTOM ? unionSlots() : slotsFor(formB);

  const layout = useMemo(() => {
    const m = new Map<string, PitchPos>();
    buildLayout(
      startersA.map((p) => p.player_id),
      formA,
      categoryOf,
    ).forEach((v, k) => m.set(k, v));
    buildLayout(
      startersB.map((p) => p.player_id),
      formB,
      categoryOf,
    ).forEach((v, k) => m.set(k, v));
    for (const p of players) {
      if (p.on_field && p.pos_x != null && p.pos_y != null)
        m.set(p.player_id, { x: p.pos_x, y: p.pos_y });
    }
    override.forEach((v, k) => m.set(k, v));
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, formA, formB, override, ratings]);

  const sum = (list: GamePlayerWithProfile[]) =>
    list.reduce((acc, p) => acc + ratingOf(p.player_id), 0);

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
      if (pa && pb)
        persistLayout(
          new Map([
            [id, pb],
            [occupant.player_id, pa],
          ]),
        );
    } else {
      persistLayout(new Map([[id, { x, y }]]));
    }
  }

  function pickFormation(team: Team, name: string) {
    if (name === CUSTOM) {
      if (team === 'A') setFormNameA(CUSTOM);
      else setFormNameB(CUSTOM);
      return;
    }
    const f = formationsFor(sizeOf(team)).find((o) => o.name === name);
    if (!f) return;
    const starters = team === 'A' ? startersA : startersB;
    if (team === 'A') setFormNameA(f.name);
    else setFormNameB(f.name);
    persistLayout(
      buildLayout(
        starters.map((p) => p.player_id),
        f,
        categoryOf,
      ),
    );
  }

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
      const pos = buildLayout(
        starters.map((p) => p.player_id),
        f,
        categoryOf,
      );
      for (const s of starters) {
        const p = pos.get(s.player_id);
        rows.push({ playerId: s.player_id, on_field: true, x: p?.x, y: p?.y });
      }
      for (const b of bench) rows.push({ playerId: b.player_id, on_field: false });
    }
    setOverride(new Map());
    if (rows.length) assignLineup.mutate(rows);
  }

  function doSubstitute(inId: string, outId: string) {
    setOverride(new Map());
    const outName = players.find((p) => p.player_id === outId)?.profile?.name ?? undefined;
    const team = players.find((p) => p.player_id === outId)?.team ?? null;
    substitute.mutate({ inId, outId, outName, team: team as Team | null, minute: currentMinute });
  }

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
  const selFormName = selectedTeam === 'A' ? (formNameA ?? formA.name) : (formNameB ?? formB.name);

  return (
    <Card>
      <div className={s.head}>
        <h2 className={s.title}>{t('teams.title')}</h2>
        {canManage && canGenerate && (
          <Button variant="secondary" size="sm" onClick={generate} loading={assignTeams.isPending}>
            {hasTeams ? t('teams.regenerate') : t('teams.generate')}
          </Button>
        )}
      </div>

      {assignTeams.isError && (
        <div className={s.errorSlot}>
          <Alert kind="error">{t('teams.generateError')}</Alert>
        </div>
      )}

      {!hasTeams ? (
        <p className={s.empty}>
          {canManage && canGenerate ? t('teams.emptyManageable') : t('teams.emptyLocked')}
        </p>
      ) : (
        <div className={s.body}>
          <div className={s.switch}>
            {(['A', 'B'] as Team[]).map((team) => {
              const active = selectedTeam === team;
              const activeClass = team === 'A' ? s.switchActiveA : s.switchActiveB;
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => setSelectedTeam(team)}
                  className={`${s.switchBtn} ${active ? activeClass : ''}`}
                >
                  {!active && <span className={`${s.dot} ${team === 'A' ? s.dotA : s.dotB}`} />}
                  {t('teams.team', { team })}
                  <span className={s.switchSum}>{sum(team === 'A' ? teamA : teamB)}</span>
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
              <div className={s.formRow}>
                <FormationSelect
                  label={t('teams.formation', { team: selectedTeam })}
                  customLabel={t('teams.formationCustom')}
                  dotClass={selectedTeam === 'A' ? s.dotA : s.dotB}
                  value={selFormName}
                  size={selSize}
                  onChange={(n) => pickFormation(selectedTeam, n)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={autoFill}
                  loading={persist.isPending}
                >
                  {t('teams.autoFill')}
                </Button>
              </div>
              <p className={s.dragHint}>{t('teams.dragHint')}</p>
            </>
          )}

          <div className={s.columns}>
            <TeamColumn
              title={t('teams.team', { team: 'A' })}
              total={sum(teamA)}
              list={teamA}
              ratingOf={ratingOf}
              canManage={canManage}
              onMove={(playerId) => setPlayerTeam.mutate({ playerId, team: 'B' })}
              moveLabel="→ B"
              fallbackName={t('teams.fallbackName')}
            />
            <TeamColumn
              title={t('teams.team', { team: 'B' })}
              total={sum(teamB)}
              list={teamB}
              ratingOf={ratingOf}
              canManage={canManage}
              onMove={(playerId) => setPlayerTeam.mutate({ playerId, team: 'A' })}
              moveLabel="→ A"
              fallbackName={t('teams.fallbackName')}
            />
          </div>
        </div>
      )}

      {hasTeams && (
        <p className={s.diff}>{t('teams.ratingDiff', { diff: Math.abs(sum(teamA) - sum(teamB)) })}</p>
      )}

      {unassigned.length > 0 && (
        <div className={s.unassigned}>
          <p className={s.unassignedTitle}>{t('teams.unassigned')}</p>
          <ul className={s.list}>
            {unassigned.map((p) => (
              <li key={p.player_id} className={s.row}>
                <span className={s.name}>
                  {p.profile?.name ?? t('teams.fallbackName')}{' '}
                  <span className={s.rating}>({ratingOf(p.player_id)})</span>
                </span>
                {canManage && (
                  <span className={s.rowActions}>
                    <button
                      onClick={() => setPlayerTeam.mutate({ playerId: p.player_id, team: 'A' })}
                      className={s.addBtn}
                    >
                      + A
                    </button>
                    <button
                      onClick={() => setPlayerTeam.mutate({ playerId: p.player_id, team: 'B' })}
                      className={s.addBtn}
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
  customLabel,
  dotClass,
  value,
  size,
  onChange,
}: {
  label: string;
  customLabel: string;
  dotClass: string;
  value: string;
  size: number;
  onChange: (name: string) => void;
}) {
  const options = formationsFor(size);
  return (
    <label className={s.formation}>
      <span className={s.formationLabel}>
        <span className={`${s.dot} ${dotClass}`} /> {label}
      </span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.name} value={o.name}>
            {o.name}
          </option>
        ))}
        <option value={CUSTOM}>{customLabel}</option>
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
  fallbackName,
}: {
  title: string;
  total: number;
  list: GamePlayerWithProfile[];
  ratingOf: (id: string) => number;
  canManage: boolean;
  onMove: (playerId: string) => void;
  moveLabel: string;
  fallbackName: string;
}) {
  return (
    <div className={s.column}>
      <div className={s.columnHead}>
        <p className={s.columnTitle}>{title}</p>
        <span className={s.columnTotal}>{total}</span>
      </div>
      <ul className={s.list}>
        {list.map((p) => (
          <li key={p.player_id} className={s.row}>
            <span className={s.name}>
              {p.profile?.name ?? fallbackName}{' '}
              <span className={s.rating}>({ratingOf(p.player_id)})</span>
            </span>
            {canManage && (
              <button onClick={() => onMove(p.player_id)} className={s.moveBtn}>
                {moveLabel}
              </button>
            )}
          </li>
        ))}
        {list.length === 0 && <li className={s.emptyRow}>—</li>}
      </ul>
    </div>
  );
}
