import { useMemo, useState } from 'react';
import { Page, PageTitle, Alert, CardSkeleton, PillTabs, Select } from '@/shared/components/ui';
import { useGameFormats } from '@/features/games/gameHooks';
import type { PositionCategory } from '@/types/database';
import { RankingList, type RankingRow } from './RankingList';
import { useRankingAnnual, useRankingByFormat, useRankingByPeriod, useRankingOverall } from './rankingHooks';
import s from './RankingsPage.module.css';

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
  const annual = useRankingAnnual(year, scope === 'anual');

  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const { rows, isLoading, isError } = useMemo((): {
    rows: RankingRow[];
    isLoading: boolean;
    isError: boolean;
  } => {
    switch (scope) {
      case 'geral':
        return {
          rows: (overall.data ?? []).map((r) => ({
            player_id: r.player_id,
            name: r.name,
            photo_url: r.photo_url,
            value: `${r.total_xp} XP`,
            sub: `${wdg(r)} · ${r.mvps} MVP`,
          })),
          isLoading: overall.isLoading,
          isError: overall.isError,
        };

      case 'posicao':
        return {
          rows: (overall.data ?? [])
            .filter((r) => r.position_category === position)
            .map((r) => ({
              player_id: r.player_id,
              name: r.name,
              photo_url: r.photo_url,
              value: `${r.total_xp} XP`,
              sub: wdg(r),
            })),
          isLoading: overall.isLoading,
          isError: overall.isError,
        };

      case 'formato':
        return {
          rows: (byFormat.data ?? []).map((r) => ({
            player_id: r.player_id,
            name: r.name,
            photo_url: r.photo_url,
            value: `${r.points} pts`,
            sub: wdg(r),
          })),
          isLoading: byFormat.isLoading,
          isError: byFormat.isError,
        };

      case 'mensal':
        return {
          rows: (byPeriod.data ?? [])
            .slice()
            .sort((a, b) => b.points - a.points)
            .map((r) => ({
              player_id: r.player_id,
              name: r.name,
              photo_url: r.photo_url,
              value: `${r.points} pts`,
              sub: wdg(r),
            })),
          isLoading: byPeriod.isLoading,
          isError: byPeriod.isError,
        };

      case 'anual':
        return {
          rows: (annual.data ?? [])
            .slice()
            .sort((a, b) => b.points - a.points)
            .map((r) => ({
              player_id: r.player_id,
              name: r.name,
              photo_url: r.photo_url,
              value: `${r.points} pts`,
              sub: wdg(r),
            })),
          isLoading: annual.isLoading,
          isError: annual.isError,
        };
    }
  }, [
    scope,
    position,
    overall.data,
    overall.isLoading,
    overall.isError,
    byFormat.data,
    byFormat.isLoading,
    byFormat.isError,
    byPeriod.data,
    byPeriod.isLoading,
    byPeriod.isError,
    annual.data,
    annual.isLoading,
    annual.isError,
  ]);

  return (
    <Page>
      <PageTitle>Rankings</PageTitle>

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
        <div className={s.filters}>
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

      {isLoading && (
        <div className={s.skeletons}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}
      {isError && <Alert kind="error">Não foi possível carregar o ranking.</Alert>}
      {!isLoading && !isError && <RankingList rows={rows} />}
    </Page>
  );
}
