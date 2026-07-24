import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

/** Analysis window, in full months (the current month counts). */
export type AnalyticsMonths = 3 | 6 | 12;

export const AREAS = [
  { key: 'games', label: 'Jogos' },
  { key: 'squads', label: 'Convocatórias' },
  { key: 'live', label: 'Jogo ao vivo' },
  { key: 'challenges', label: 'Desafios' },
  { key: 'iconic', label: 'Golos icónicos' },
  { key: 'places', label: 'Locais' },
] as const;

/** Key identifying one of the app areas in `AREAS`. */
export type AreaKey = (typeof AREAS)[number]['key'];

/** A label paired with a count. */
export interface LabelCount {
  label: string;
  count: number;
}

/** A player identified by id/name, paired with a count. */
export interface PlayerCount {
  id: string;
  name: string;
  count: number;
}

/** A period's value alongside its prior counterpart, for computing variation. */
export interface Kpi {
  value: number;
  previous: number;
}

/** Summary KPIs shown at the top of the usage analytics page. */
export interface UsageSummary {
  activeUsers: Kpi;
  activityRate: Kpi;
  newUsers: Kpi;
  actions: Kpi;
  actionsPerUser: Kpi;
  dormant: Kpi;
}

/** One monthly data point with actions split by area, for stacked bars. */
export type MonthActions = { label: string } & Record<AreaKey, number>;

/** One month's user counts: active, new, registered and the active rate. */
export interface MonthUsers {
  label: string;
  activeUsers: number;
  newUsers: number;
  registered: number;
  activeRate: number;
}

/** A label with a count and its share of the total. */
export interface ReachRow {
  label: string;
  count: number;
  share: number;
}

/** One heatmap row (a time band) with per-weekday cell counts. */
export interface HeatRow {
  band: string;
  cells: LabelCount[];
}

/** Aggregated data backing the platform usage analytics page. */
export interface UsageData {
  summary: UsageSummary;
  monthlyActions: MonthActions[];
  monthlyUsers: MonthUsers[];
  areaActions: LabelCount[];
  areaReach: ReachRow[];
  heatmap: HeatRow[];
  topUsers: PlayerCount[];
  accountMix: LabelCount[];
  totalUsers: number;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const HOUR_BANDS = [
  { band: 'Manhã', from: 6, to: 12 },
  { band: 'Tarde', from: 12, to: 18 },
  { band: 'Noite', from: 18, to: 24 },
  { band: 'Madrugada', from: 0, to: 6 },
];

const DORMANT_DAYS = 30;

interface Action {
  at: Date;
  userId: string;
  area: AreaKey;
}

function monthStart(back: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - back, 1);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function daysBefore(from: Date, days: number): Date {
  return new Date(from.getTime() - days * 86_400_000);
}

function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function byCountDesc(map: Map<string, number>): LabelCount[] {
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** Platform usage analytics: who signs in, what they use, and when — aggregated client-side. */
export function useUsageAnalytics(months: AnalyticsMonths) {
  return useQuery({
    queryKey: ['admin_usage_analytics', months],
    staleTime: 60_000,
    queryFn: async (): Promise<UsageData> => {
      const [profiles, games, squads, events, attempts, replicas, places] = await Promise.all([
        supabase.from('profile').select('id, name, created_at'),
        supabase.from('game').select('created_by, created_at'),
        supabase.from('game_player').select('player_id, added_at'),
        supabase.from('event').select('created_by, created_at'),
        supabase.from('challenge_attempt').select('created_by, played_at'),
        supabase.from('iconic_goal_replica').select('player_id, replicated_at'),
        supabase.from('place').select('created_by, created_at'),
      ]);
      for (const r of [profiles, games, squads, events, attempts, replicas, places]) {
        if (r.error) throw r.error;
      }

      const actions: Action[] = [
        ...(games.data ?? []).map((r) => ({
          at: new Date(r.created_at),
          userId: r.created_by,
          area: 'games' as AreaKey,
        })),
        ...(squads.data ?? []).map((r) => ({
          at: new Date(r.added_at),
          userId: r.player_id,
          area: 'squads' as AreaKey,
        })),
        ...(events.data ?? []).map((r) => ({
          at: new Date(r.created_at),
          userId: r.created_by,
          area: 'live' as AreaKey,
        })),
        ...(attempts.data ?? []).map((r) => ({
          at: new Date(r.played_at),
          userId: r.created_by,
          area: 'challenges' as AreaKey,
        })),
        ...(replicas.data ?? []).map((r) => ({
          at: new Date(r.replicated_at),
          userId: r.player_id,
          area: 'iconic' as AreaKey,
        })),
        ...(places.data ?? []).map((r) => ({
          at: new Date(r.created_at),
          userId: r.created_by,
          area: 'places' as AreaKey,
        })),
      ];

      const start = monthStart(months - 1);
      const prevStart = monthStart(months * 2 - 1);
      const inWindow = actions.filter((a) => a.at >= start);
      const inPrev = actions.filter((a) => a.at >= prevStart && a.at < start);

      const monthlyActions: MonthActions[] = [];
      const monthlyUsers: MonthUsers[] = [];
      const index = new Map<string, number>();
      for (let i = months - 1; i >= 0; i--) {
        const d = monthStart(i);
        index.set(monthKey(d), monthlyActions.length);
        const label = d.toLocaleDateString('pt-PT', { month: 'short' });
        const row = { label } as MonthActions;
        for (const a of AREAS) row[a.key] = 0;
        monthlyActions.push(row);
        monthlyUsers.push({ label, activeUsers: 0, newUsers: 0, registered: 0, activeRate: 0 });
      }

      const activeByMonth = new Map<number, Set<string>>();
      for (const a of inWindow) {
        const i = index.get(monthKey(a.at));
        if (i === undefined) continue;
        monthlyActions[i][a.area] += 1;
        if (!activeByMonth.has(i)) activeByMonth.set(i, new Set());
        activeByMonth.get(i)?.add(a.userId);
      }

      const allProfiles = profiles.data ?? [];
      for (let i = 0; i < monthlyUsers.length; i++) {
        const monthEnd = monthStart(months - 2 - i);
        monthlyUsers[i].registered = allProfiles.filter(
          (p) => new Date(p.created_at) < monthEnd,
        ).length;
        monthlyUsers[i].activeUsers = activeByMonth.get(i)?.size ?? 0;
        monthlyUsers[i].activeRate = Number(
          (ratio(monthlyUsers[i].activeUsers, monthlyUsers[i].registered) * 100).toFixed(1),
        );
      }
      for (const p of allProfiles) {
        const i = index.get(monthKey(new Date(p.created_at)));
        if (i !== undefined) monthlyUsers[i].newUsers += 1;
      }

      const areaActions = new Map<string, number>();
      const areaUsers = new Map<string, Set<string>>();
      const perUser = new Map<string, number>();
      const activeUsers = new Set<string>();
      for (const a of inWindow) {
        const label = AREAS.find((x) => x.key === a.area)?.label ?? a.area;
        areaActions.set(label, (areaActions.get(label) ?? 0) + 1);
        if (!areaUsers.has(label)) areaUsers.set(label, new Set());
        areaUsers.get(label)?.add(a.userId);
        perUser.set(a.userId, (perUser.get(a.userId) ?? 0) + 1);
        activeUsers.add(a.userId);
      }
      const activePrev = new Set(inPrev.map((a) => a.userId));

      const totalUsers = allProfiles.length;
      const areaReach = AREAS.map((a) => {
        const count = areaUsers.get(a.label)?.size ?? 0;
        return { label: a.label, count, share: ratio(count, totalUsers) * 100 };
      })
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count);

      const heatmap: HeatRow[] = HOUR_BANDS.map((b) => ({
        band: b.band,
        cells: WEEKDAYS.map((label) => ({ label, count: 0 })),
      }));
      for (const a of inWindow) {
        const row = HOUR_BANDS.findIndex(
          (b) => a.at.getHours() >= b.from && a.at.getHours() < b.to,
        );
        if (row >= 0) heatmap[row].cells[weekdayIndex(a.at)].count += 1;
      }

      const now = new Date();
      const lastSeen = new Map<string, Date>();
      for (const a of actions) {
        const seen = lastSeen.get(a.userId);
        if (!seen || a.at > seen) lastSeen.set(a.userId, a.at);
      }
      const dormantAt = (moment: Date) => {
        const cut = daysBefore(moment, DORMANT_DAYS);
        return allProfiles.filter((p) => {
          if (new Date(p.created_at) > cut) return false;
          const seen = lastSeen.get(p.id);
          return !seen || seen < cut;
        }).length;
      };
      const recent = daysBefore(now, DORMANT_DAYS);
      let recentlyActive = 0;
      let sleeping = 0;
      let never = 0;
      for (const p of allProfiles) {
        const seen = lastSeen.get(p.id);
        if (!seen) never += 1;
        else if (seen >= recent) recentlyActive += 1;
        else sleeping += 1;
      }

      const names = new Map(allProfiles.map((p) => [p.id, p.name]));
      const topUsers = [...perUser.entries()]
        .map(([id, count]) => ({ id, name: names.get(id) ?? 'Utilizador', count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      const newInWindow = allProfiles.filter((p) => new Date(p.created_at) >= start).length;
      const newInPrev = allProfiles.filter((p) => {
        const d = new Date(p.created_at);
        return d >= prevStart && d < start;
      }).length;
      const baseAtStart = allProfiles.filter((p) => new Date(p.created_at) < start).length;

      return {
        summary: {
          activeUsers: { value: activeUsers.size, previous: activePrev.size },
          activityRate: {
            value: ratio(activeUsers.size, totalUsers) * 100,
            previous: ratio(activePrev.size, baseAtStart) * 100,
          },
          newUsers: { value: newInWindow, previous: newInPrev },
          actions: { value: inWindow.length, previous: inPrev.length },
          actionsPerUser: {
            value: ratio(inWindow.length, activeUsers.size),
            previous: ratio(inPrev.length, activePrev.size),
          },
          dormant: { value: dormantAt(now), previous: dormantAt(start) },
        },
        monthlyActions,
        monthlyUsers,
        areaActions: byCountDesc(areaActions),
        areaReach,
        heatmap,
        topUsers,
        accountMix: [
          { label: 'Ativos (30 dias)', count: recentlyActive },
          { label: 'Adormecidos', count: sleeping },
          { label: 'Nunca usaram', count: never },
        ].filter((x) => x.count > 0),
        totalUsers,
      };
    },
  });
}

/** Measured (not inferred) tracking usage data — visits, sessions and pages. */
export interface TrackingAnalytics {
  hasData: boolean;
  consented: number;
  totalUsers: number;
  pageViews: Kpi;
  sessions: Kpi;
  viewsPerSession: Kpi;
  visitors: Kpi;
  byMonth: LabelCount[];
  topPages: ReachRow[];
  entryPages: LabelCount[];
  devices: LabelCount[];
  heatmap: HeatRow[];
}

/** Fetches measured tracking usage from consented users' events. */
export function useTrackingAnalytics(months: AnalyticsMonths) {
  return useQuery({
    queryKey: ['admin_tracking_analytics', months],
    staleTime: 60_000,
    queryFn: async (): Promise<TrackingAnalytics> => {
      const prevStart = monthStart(months * 2 - 1);
      const [events, consents, profiles] = await Promise.all([
        supabase
          .from('app_event')
          .select('user_id, session_id, name, path, props, created_at')
          .gte('created_at', prevStart.toISOString()),
        supabase.from('analytics_consent').select('granted').eq('granted', true),
        supabase.from('profile').select('id'),
      ]);
      for (const r of [events, consents, profiles]) {
        if (r.error) throw r.error;
      }

      const start = monthStart(months - 1);
      const rows = (events.data ?? []).map((e) => ({ ...e, at: new Date(e.created_at) }));
      const inWindow = rows.filter((e) => e.at >= start);
      const inPrev = rows.filter((e) => e.at < start);

      const views = (list: typeof rows) => list.filter((e) => e.name === 'page_view');

      const byMonth: LabelCount[] = [];
      const index = new Map<string, number>();
      for (let i = months - 1; i >= 0; i--) {
        const d = monthStart(i);
        index.set(monthKey(d), byMonth.length);
        byMonth.push({ label: d.toLocaleDateString('pt-PT', { month: 'short' }), count: 0 });
      }

      const pageCounts = new Map<string, number>();
      const pageUsers = new Map<string, Set<string>>();
      const entryCounts = new Map<string, number>();
      const deviceCounts = new Map<string, number>();
      const heatmap: HeatRow[] = HOUR_BANDS.map((b) => ({
        band: b.band,
        cells: WEEKDAYS.map((label) => ({ label, count: 0 })),
      }));

      for (const e of inWindow) {
        if (e.name === 'page_view') {
          const i = index.get(monthKey(e.at));
          if (i !== undefined) byMonth[i].count += 1;
          const path = e.path ?? '/';
          pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);
          if (!pageUsers.has(path)) pageUsers.set(path, new Set());
          pageUsers.get(path)?.add(e.user_id);
          const band = HOUR_BANDS.findIndex(
            (b) => e.at.getHours() >= b.from && e.at.getHours() < b.to,
          );
          if (band >= 0) heatmap[band].cells[weekdayIndex(e.at)].count += 1;
        } else if (e.name === 'session_start') {
          entryCounts.set(e.path ?? '/', (entryCounts.get(e.path ?? '/') ?? 0) + 1);
          const device = (e.props as { device?: string } | null)?.device ?? 'desconhecido';
          deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1);
        }
      }

      const totalUsers = (profiles.data ?? []).length;
      const sessionsNow = new Set(inWindow.map((e) => e.session_id)).size;
      const sessionsPrev = new Set(inPrev.map((e) => e.session_id)).size;
      const viewsNow = views(inWindow).length;
      const viewsPrev = views(inPrev).length;

      const topPages = [...pageCounts.entries()]
        .map(([label, count]) => ({
          label,
          count,
          share: ratio(pageUsers.get(label)?.size ?? 0, totalUsers) * 100,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        hasData: rows.length > 0,
        consented: (consents.data ?? []).length,
        totalUsers,
        pageViews: { value: viewsNow, previous: viewsPrev },
        sessions: { value: sessionsNow, previous: sessionsPrev },
        viewsPerSession: {
          value: ratio(viewsNow, sessionsNow),
          previous: ratio(viewsPrev, sessionsPrev),
        },
        visitors: {
          value: new Set(inWindow.map((e) => e.user_id)).size,
          previous: new Set(inPrev.map((e) => e.user_id)).size,
        },
        byMonth,
        topPages,
        entryPages: byCountDesc(entryCounts).slice(0, 6),
        devices: byCountDesc(deviceCounts),
        heatmap,
      };
    },
  });
}

/** Aggregated bug report stats: open/total counts, by page and by month. */
export interface BugAnalytics {
  open: number;
  total: number;
  byPage: LabelCount[];
  byMonth: LabelCount[];
  reporters: number;
}

/** Fetches bug report analytics for the given window. */
export function useBugAnalytics(months: AnalyticsMonths) {
  return useQuery({
    queryKey: ['admin_bug_analytics', months],
    staleTime: 60_000,
    queryFn: async (): Promise<BugAnalytics> => {
      const { data, error } = await supabase
        .from('bug_report')
        .select('reporter_id, page, status, created_at');
      if (error) throw error;

      const start = monthStart(months - 1);
      const byMonth: LabelCount[] = [];
      const index = new Map<string, number>();
      for (let i = months - 1; i >= 0; i--) {
        const d = monthStart(i);
        index.set(monthKey(d), byMonth.length);
        byMonth.push({ label: d.toLocaleDateString('pt-PT', { month: 'short' }), count: 0 });
      }

      const byPage = new Map<string, number>();
      const reporters = new Set<string>();
      let open = 0;
      let total = 0;

      for (const r of data ?? []) {
        const d = new Date(r.created_at);
        if (d < start) continue;
        total += 1;
        if (r.status !== 'resolved') open += 1;
        reporters.add(r.reporter_id);
        const page = r.page ?? 'Sem página';
        byPage.set(page, (byPage.get(page) ?? 0) + 1);
        const i = index.get(monthKey(d));
        if (i !== undefined) byMonth[i].count += 1;
      }

      return {
        open,
        total,
        byPage: byCountDesc(byPage).slice(0, 8),
        byMonth,
        reporters: reporters.size,
      };
    },
  });
}
