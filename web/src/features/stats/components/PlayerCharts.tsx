import { Card, LockOverlay } from '@/shared/components/ui';
import { BallIcon, BootIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import {
  useRatingTrend,
  useContributions,
  useXpBreakdown,
  MIN_GAMES_FOR_STATS,
  statsLockMessage,
  type GameContribution,
  type RatingPoint,
  type RecentGame,
} from '../hooks/statsHooks';
import { RatingTrend } from './RatingTrend';
import { RecentMatchesCard } from './RecentMatches';
import s from './PlayerCharts.module.css';

const MOCK_TREND: RatingPoint[] = [6.2, 7.1, 5.8, 7.6, 6.9, 8.0].map((rating, i) => ({
  gameId: String(i),
  date: '',
  rating,
  label: `J${i + 1}`,
}));
const MOCK_CONTRIB: GameContribution[] = [
  { gameId: '1', label: 'J1', goals: 1, assists: 0 },
  { gameId: '2', label: 'J2', goals: 2, assists: 1 },
  { gameId: '3', label: 'J3', goals: 0, assists: 2 },
  { gameId: '4', label: 'J4', goals: 1, assists: 1 },
  { gameId: '5', label: 'J5', goals: 3, assists: 0 },
];
const MOCK_XP = [
  { key: 'stats.games', value: 120 },
  { key: 'stats.goals', value: 80 },
  { key: 'stats.assists', value: 50 },
  { key: 'achievements.title', value: 30 },
];
const MOCK_RECENT: RecentGame[] = [
  {
    gameId: '1',
    date: '',
    label: 'J1',
    rating: 7.2,
    result: 'V',
    scoreFor: 3,
    scoreAgainst: 1,
    formatLabel: '5v5',
  },
  {
    gameId: '2',
    date: '',
    label: 'J2',
    rating: 6.5,
    result: 'E',
    scoreFor: 2,
    scoreAgainst: 2,
    formatLabel: '5v5',
  },
  {
    gameId: '3',
    date: '',
    label: 'J3',
    rating: 8.1,
    result: 'V',
    scoreFor: 4,
    scoreAgainst: 0,
    formatLabel: '5v5',
  },
  {
    gameId: '4',
    date: '',
    label: 'J4',
    rating: 5.9,
    result: 'D',
    scoreFor: 1,
    scoreAgainst: 2,
    formatLabel: '5v5',
  },
  {
    gameId: '5',
    date: '',
    label: 'J5',
    rating: 7.0,
    result: 'V',
    scoreFor: 3,
    scoreAgainst: 2,
    formatLabel: '5v5',
  },
];

/** Player chart cards (form trend, goals/assists, XP by source), returned as a fragment to fit into a grid. */
export function PlayerCharts({
  playerId,
  games,
  own = false,
}: {
  playerId: string;
  games: number;
  own?: boolean;
}) {
  const { t } = useT();
  const { data: trend } = useRatingTrend(playerId);
  const { data: contrib } = useContributions(playerId);
  const { data: xp } = useXpBreakdown(playerId);

  const hasContrib = (contrib ?? []).some((c) => c.goals > 0 || c.assists > 0);

  if (games < MIN_GAMES_FOR_STATS) {
    return (
      <LockOverlay locked className={s.lockedWrap} message={statsLockMessage(t, own)}>
        <div className={s.lockedGrid}>
          <RecentMatchesCard data={MOCK_RECENT} />
          <Card className={s.chartCard}>
            <ChartHead
              title={t('stats.chart.form')}
              hint={t('stats.chart.lastGames', { count: MOCK_TREND.length })}
            />
            <div className={s.trendRow}>
              <RatingTrend points={MOCK_TREND} />
            </div>
          </Card>
          <Card>
            <ChartHead
              title={t('stats.chart.goalsAssists')}
              hint={t('stats.chart.perGame')}
            />
            <ContributionBars data={MOCK_CONTRIB} t={t} />
            <div className={s.legend}>
              <span className={s.legendItem}>
                <BallIcon width={14} height={14} className={s.iconGoal} /> {t('stats.goals')}
              </span>
              <span className={s.legendItem}>
                <BootIcon width={14} height={14} className={s.iconAssist} />{' '}
                {t('stats.assistsShort')}
              </span>
            </div>
          </Card>
          <Card className={s.chartCard}>
            <ChartHead title={t('stats.chart.xpBySource')} hint={t('stats.chart.xpSourceHint')} />
            <HBars items={MOCK_XP.map((x) => ({ label: t(x.key), value: x.value }))} suffix=" XP" />
          </Card>
        </div>
      </LockOverlay>
    );
  }

  return (
    <>
      {trend && trend.length >= 2 && (
        <Card className={s.chartCard}>
          <ChartHead
            title={t('stats.chart.form')}
            hint={t('stats.chart.lastGames', { count: trend.length })}
          />
          <div className={s.trendRow}>
            <RatingTrend points={trend} />
          </div>
        </Card>
      )}

      {hasContrib && (
        <Card>
          <ChartHead title={t('stats.chart.goalsAssists')} hint={t('stats.chart.perGame')} />
          <ContributionBars data={contrib ?? []} t={t} />
          <div className={s.legend}>
            <span className={s.legendItem}>
              <BallIcon width={14} height={14} className={s.iconGoal} /> {t('stats.goals')}
            </span>
            <span className={s.legendItem}>
              <BootIcon width={14} height={14} className={s.iconAssist} />{' '}
              {t('stats.assistsShort')}
            </span>
          </div>
        </Card>
      )}

      {xp && xp.length > 0 && (
        <Card className={s.chartCard}>
          <ChartHead title={t('stats.chart.xpBySource')} hint={t('stats.chart.xpSourceHint')} />
          <HBars items={xp.map((x) => ({ label: x.label, value: x.points }))} suffix=" XP" />
        </Card>
      )}
    </>
  );
}

function ChartHead({ title, hint }: { title: string; hint: string }) {
  return (
    <div className={s.head}>
      <h2 className={s.title}>{title}</h2>
      <span className={s.hint}>{hint}</span>
    </div>
  );
}

const ICON = 16;
const STACK_GAP = 2;
const BUDGET = 5;
const STACK_BOX = BUDGET * ICON + (BUDGET - 1) * STACK_GAP;

function allocate(goals: number, assists: number) {
  const gs = Math.min(goals, BUDGET - (assists > 0 ? 1 : 0));
  return { gs, as: Math.min(assists, BUDGET - gs) };
}

function run(v: number, slots: number) {
  if (v <= slots) return { plain: v, count: 0 };
  return { plain: slots - 1, count: v - (slots - 1) };
}

function ContributionBars({
  data,
  t,
}: {
  data: GameContribution[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <div className={s.bars}>
      {data.map((d) => {
        const { gs, as } = allocate(d.goals, d.assists);
        const g = run(d.goals, gs);
        const a = run(d.assists, as);
        return (
          <div key={d.gameId} className={s.barCol}>
            <div
              className={s.stack}
              style={{ height: STACK_BOX }}
              title={t('stats.chart.tooltip', { goals: d.goals, assists: d.assists })}
            >
              {Array.from({ length: g.plain }).map((_, i) => (
                <BallIcon key={`g${i}`} width={ICON} height={ICON} className={s.iconGoal} />
              ))}
              {g.count > 0 && <CountIcon n={g.count} className={s.iconGoal} />}
              {Array.from({ length: a.plain }).map((_, i) => (
                <BootIcon key={`a${i}`} width={ICON} height={ICON} className={s.iconAssist} />
              ))}
              {a.count > 0 && <CountIcon n={a.count} className={s.iconAssist} />}
              {d.goals === 0 && d.assists === 0 && <span className={s.empty}>·</span>}
            </div>
            <span className={s.barLabel}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function CountIcon({ n, className }: { n: number; className?: string }) {
  return (
    <svg
      width={ICON}
      height={ICON}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={n > 99 ? 7 : n > 9 ? 9.5 : 12}
        fontWeight="700"
        className={s.countText}
      >
        {n}
      </text>
    </svg>
  );
}

function HBars({
  items,
  suffix = '',
}: {
  items: { label: string; value: number }[];
  suffix?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className={s.hbars}>
      {items.map((i) => (
        <div key={i.label} className={s.hbarRow}>
          <span className={s.hbarLabel}>{i.label}</span>
          <div className={s.hbarTrack}>
            <div className={s.hbarFill} style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          <span className={s.hbarValue}>
            {i.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
