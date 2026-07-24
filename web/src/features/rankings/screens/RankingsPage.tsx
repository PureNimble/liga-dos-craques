import { useCallback, useMemo, useState } from 'react';
import { Page, PageTitle, Alert, CardSkeleton, PillTabs, Select } from '@/shared/components/ui';
import { useGameFormats } from '@/features/games/hooks/gameHooks';
import { useT } from '@/shared/i18n/useT';
import type { PositionCategory } from '@/types/database';
import { RankingList, type RankingRow } from '../components/RankingList';
import {
  useRankingAnnual,
  useRankingByFormat,
  useRankingByPeriod,
  useRankingOverall,
} from '../hooks/rankingHooks';
import s from './RankingsPage.module.css';

type Scope = 'geral' | 'posicao' | 'formato' | 'mensal' | 'anual';

const SCOPE_KEY: Record<Scope, string> = {
  geral: 'rankings.scope.overall',
  posicao: 'rankings.scope.position',
  formato: 'rankings.scope.format',
  mensal: 'rankings.scope.monthly',
  anual: 'rankings.scope.annual',
};

const SCOPES: Scope[] = ['geral', 'posicao', 'formato', 'mensal', 'anual'];

const POSITION_KEY: Record<PositionCategory, string> = {
  GK: 'rankings.position.GK',
  DEF: 'rankings.position.DEF',
  MID: 'rankings.position.MID',
  FWD: 'rankings.position.FWD',
};

const MONTH_KEYS = [
  'rankings.month.1',
  'rankings.month.2',
  'rankings.month.3',
  'rankings.month.4',
  'rankings.month.5',
  'rankings.month.6',
  'rankings.month.7',
  'rankings.month.8',
  'rankings.month.9',
  'rankings.month.10',
  'rankings.month.11',
  'rankings.month.12',
];

/** Rankings page with switchable scopes: overall, position, format, monthly, and annual. */
export function RankingsPage() {
  const { t } = useT();
  const wdg = useCallback(
    (r: { games: number; wins: number; goals: number }) =>
      t('rankings.summary.wdg', { games: r.games, wins: r.wins, goals: r.goals }),
    [t],
  );
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
            value: t('rankings.summary.xp', { value: r.total_xp }),
            sub: t('rankings.summary.mvps', { summary: wdg(r), mvps: r.mvps }),
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
              value: t('rankings.summary.xp', { value: r.total_xp }),
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
            value: t('rankings.summary.points', { value: r.points }),
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
              value: t('rankings.summary.points', { value: r.points }),
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
              value: t('rankings.summary.points', { value: r.points }),
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
    t,
    wdg,
  ]);

  return (
    <Page>
      <PageTitle>{t('rankings.title')}</PageTitle>

      <PillTabs<Scope>
        value={scope}
        onChange={setScope}
        items={SCOPES.map((key) => ({ value: key, label: t(SCOPE_KEY[key]) }))}
      />

      {scope === 'posicao' && (
        <Select value={position} onChange={(e) => setPosition(e.target.value as PositionCategory)}>
          {(Object.keys(POSITION_KEY) as PositionCategory[]).map((c) => (
            <option key={c} value={c}>
              {t(POSITION_KEY[c])}
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
              {MONTH_KEYS.map((key, i) => (
                <option key={key} value={i + 1}>
                  {t(key)}
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
      {isError && <Alert kind="error">{t('rankings.loadError')}</Alert>}
      {!isLoading && !isError && <RankingList rows={rows} />}
    </Page>
  );
}
