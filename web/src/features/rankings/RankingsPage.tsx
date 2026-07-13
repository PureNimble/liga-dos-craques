import { useMemo, useState } from 'react';
import { PillTabs, Select } from '@/components/ui';
import { useGameFormats } from '@/features/games/gameHooks';
import type { PositionCategory } from '@/types/database';
import { RankingList, type RankingRow } from './RankingList';
import { useRankingByFormat, useRankingByPeriod, useRankingOverall } from './rankingHooks';

type Scope = 'geral' | 'posicao' | 'formato' | 'mensal' | 'anual';

const SCOPES: { key: Scope; label: string }[] = [
  { key: 'geral', label: 'Geral' },
  { key: 'posicao', label: 'Posição' },
  { key: 'formato', label: 'Formato' },
  { key: 'mensal', label: 'Mensal' },
  { key: 'anual', label: 'Anual' },
];

const POSITION_LABELS: Record<PositionCategory, string> = {
  GK: 'Guarda-redes',
  DEF: 'Defesas',
  MID: 'Médios',
  FWD: 'Avançados',
};

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const wdg = (r: { games: number; wins: number; goals: number }) =>
  `${r.games}J · ${r.wins}V · ${r.goals}G`;

export function RankingsPage() {
  const now = new Date();
  const [scope, setScope] = useState<Scope>('geral');
  const [position, setPosition] = useState<PositionCategory>('FWD');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: formats } = useGameFormats();
  const [formatCode, setFormatCode] = useState('5v5');

  const overall = useRankingOverall();
  const byFormat = useRankingByFormat(scope === 'formato' ? formatCode : undefined);
  const byPeriod = useRankingByPeriod(year, scope === 'mensal' ? month : undefined);

  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const rows: RankingRow[] = useMemo(() => {
    if (scope === 'geral') {
      return (overall.data ?? []).map((r) => ({
        player_id: r.player_id,
        name: r.name,
        photo_url: r.photo_url,
        value: `${r.total_xp} XP`,
        sub: `${wdg(r)} · ${r.mvps} MVP`,
      }));
    }
    if (scope === 'posicao') {
      return (overall.data ?? [])
        .filter((r) => r.position_category === position)
        .map((r) => ({
          player_id: r.player_id,
          name: r.name,
          photo_url: r.photo_url,
          value: `${r.total_xp} XP`,
          sub: wdg(r),
        }));
    }
    if (scope === 'formato') {
      return (byFormat.data ?? []).map((r) => ({
        player_id: r.player_id,
        name: r.name,
        photo_url: r.photo_url,
        value: `${r.points} pts`,
        sub: wdg(r),
      }));
    }
    if (scope === 'mensal') {
      return (byPeriod.data ?? [])
        .slice()
        .sort((a, b) => b.points - a.points)
        .map((r) => ({
          player_id: r.player_id,
          name: r.name,
          photo_url: r.photo_url,
          value: `${r.points} pts`,
          sub: wdg(r),
        }));
    }
    // anual: agrega os meses do ano por jogador
    interface Acc {
      player_id: string;
      name: string;
      photo_url: string | null;
      points: number;
      games: number;
      wins: number;
      goals: number;
    }
    const agg = new Map<string, Acc>();
    for (const r of byPeriod.data ?? []) {
      const cur = agg.get(r.player_id) ?? {
        player_id: r.player_id,
        name: r.name,
        photo_url: r.photo_url,
        points: 0,
        games: 0,
        wins: 0,
        goals: 0,
      };
      cur.points += r.points;
      cur.games += r.games;
      cur.wins += r.wins;
      cur.goals += r.goals;
      agg.set(r.player_id, cur);
    }
    return [...agg.values()]
      .sort((a, b) => b.points - a.points)
      .map((a) => ({
        player_id: a.player_id,
        name: a.name,
        photo_url: a.photo_url,
        value: `${a.points} pts`,
        sub: wdg(a),
      }));
  }, [scope, overall.data, byFormat.data, byPeriod.data, position]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-2xl font-bold tracking-tightest text-white sm:text-3xl">Rankings</h1>

      {/* Seletor de âmbito */}
      <PillTabs<Scope>
        value={scope}
        onChange={setScope}
        items={SCOPES.map((s) => ({ value: s.key, label: s.label }))}
      />

      {/* Filtros dependentes do âmbito */}
      {scope === 'posicao' && (
        <Select value={position} onChange={(e) => setPosition(e.target.value as PositionCategory)}>
          {(Object.keys(POSITION_LABELS) as PositionCategory[]).map((c) => (
            <option key={c} value={c}>
              {POSITION_LABELS[c]}
            </option>
          ))}
        </Select>
      )}
      {scope === 'formato' && (
        <Select value={formatCode} onChange={(e) => setFormatCode(e.target.value)}>
          {formats?.map((f) => (
            <option key={f.id} value={f.code}>
              {f.label}
            </option>
          ))}
        </Select>
      )}
      {(scope === 'mensal' || scope === 'anual') && (
        <div className="flex gap-2">
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          {scope === 'mensal' && (
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      <RankingList rows={rows} />
    </div>
  );
}
