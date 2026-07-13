import { Card } from '@/shared/components/ui';
import { BallIcon, BootIcon } from '@/shared/components/ui/icons';
import { useRatingTrend, useContributions, useXpBreakdown, type GameContribution } from './statsHooks';
import { RatingTrend } from './RatingTrend';

/** Cartões de gráficos do jogador — devolvidos como fragmento para caber num grid. */
export function PlayerCharts({ playerId }: { playerId: string }) {
  const { data: trend } = useRatingTrend(playerId);
  const { data: contrib } = useContributions(playerId);
  const { data: xp } = useXpBreakdown(playerId);

  const hasContrib = (contrib ?? []).some((c) => c.goals > 0 || c.assists > 0);

  return (
    <>
      {trend && trend.length >= 2 && (
        <Card className="flex flex-col">
          <ChartHead title="Forma" hint={`Últimos ${trend.length} jogos`} />
          <div className="flex flex-1 items-center">
            <RatingTrend points={trend} />
          </div>
        </Card>
      )}

      {hasContrib && (
        <Card>
          <ChartHead title="Golos e assistências" hint="Por jogo" />
          <ContributionBars data={contrib ?? []} />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <BallIcon width={14} height={14} className="text-pitch-300" /> Golos
            </span>
            <span className="flex items-center gap-1.5">
              <BootIcon width={14} height={14} className="text-sky-300" /> Assist.
            </span>
          </div>
        </Card>
      )}

      {xp && xp.length > 0 && (
        <Card>
          <ChartHead title="XP por fonte" hint="De onde vem o XP" />
          <HBars items={xp.map((x) => ({ label: x.label, value: x.points }))} suffix=" XP" />
        </Card>
      )}
    </>
  );
}

function ChartHead({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">{title}</h2>
      <span className="text-xs text-slate-500">{hint}</span>
    </div>
  );
}

/** Pictograma por jogo: uma barra única — bolas (golos) em baixo, botas (assists) por cima. */
function ContributionBars({ data }: { data: GameContribution[] }) {
  return (
    <div className="flex items-end gap-2">
      {data.map((d) => (
        <div key={d.gameId} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className="flex flex-col-reverse items-center gap-0.5"
            title={`${d.goals} golo${d.goals === 1 ? '' : 's'} · ${d.assists} assist.`}
          >
            {Array.from({ length: d.goals }).map((_, i) => (
              <BallIcon key={`g${i}`} width={15} height={15} className="text-pitch-300" />
            ))}
            {Array.from({ length: d.assists }).map((_, i) => (
              <BootIcon key={`a${i}`} width={15} height={15} className="text-sky-300" />
            ))}
            {d.goals === 0 && d.assists === 0 && <span className="pb-1 text-slate-700">·</span>}
          </div>
          <span className="text-[9px] tabular-nums text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Barras horizontais de magnitude (uma cor, rótulo à esquerda, valor à direita). */
function HBars({ items, suffix = '' }: { items: { label: string; value: number }[]; suffix?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-xs text-slate-400">{i.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pitch-600 to-pitch-400"
              style={{ width: `${(i.value / max) * 100}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums text-slate-200">
            {i.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
