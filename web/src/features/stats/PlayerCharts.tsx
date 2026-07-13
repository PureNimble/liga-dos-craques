import { Card } from '@/shared/components/ui';
import { BallIcon, BootIcon } from '@/shared/components/ui/icons';
import { useRatingTrend, useContributions, useXpBreakdown, type GameContribution } from './statsHooks';
import { RatingTrend } from './RatingTrend';
import s from './PlayerCharts.module.css';

/** Cartões de gráficos do jogador — devolvidos como fragmento para caber num grid. */
export function PlayerCharts({ playerId }: { playerId: string }) {
  const { data: trend } = useRatingTrend(playerId);
  const { data: contrib } = useContributions(playerId);
  const { data: xp } = useXpBreakdown(playerId);

  const hasContrib = (contrib ?? []).some((c) => c.goals > 0 || c.assists > 0);

  return (
    <>
      {trend && trend.length >= 2 && (
        <Card className={s.chartCard}>
          <ChartHead title="Forma" hint={`Últimos ${trend.length} jogos`} />
          <div className={s.trendRow}>
            <RatingTrend points={trend} />
          </div>
        </Card>
      )}

      {hasContrib && (
        <Card>
          <ChartHead title="Golos e assistências" hint="Por jogo" />
          <ContributionBars data={contrib ?? []} />
          <div className={s.legend}>
            <span className={s.legendItem}>
              <BallIcon width={14} height={14} className={s.iconGoal} /> Golos
            </span>
            <span className={s.legendItem}>
              <BootIcon width={14} height={14} className={s.iconAssist} /> Assist.
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
    <div className={s.head}>
      <h2 className={s.title}>{title}</h2>
      <span className={s.hint}>{hint}</span>
    </div>
  );
}

/** Pictograma por jogo: uma barra única — bolas (golos) em baixo, botas (assists) por cima. */
// Altura fixa da área de ícones (px) — tem de bater com `.stack` no CSS.
const STACK_BOX = 84;
const STACK_GAP = 2;
const ICON_MAX = 15;

function ContributionBars({ data }: { data: GameContribution[] }) {
  // O jogo com mais contribuições define o tamanho do ícone, para que ATÉ a
  // pilha mais alta caiba na caixa (altura fixa) — os dados nunca transbordam.
  const maxStack = Math.max(1, ...data.map((d) => d.goals + d.assists));
  const iconSize = Math.max(
    6,
    Math.min(ICON_MAX, Math.floor((STACK_BOX - (maxStack - 1) * STACK_GAP) / maxStack)),
  );

  return (
    <div className={s.bars}>
      {data.map((d) => (
        <div key={d.gameId} className={s.barCol}>
          <div
            className={s.stack}
            title={`${d.goals} golo${d.goals === 1 ? '' : 's'} · ${d.assists} assist.`}
          >
            {Array.from({ length: d.goals }).map((_, i) => (
              <BallIcon key={`g${i}`} width={iconSize} height={iconSize} className={s.iconGoal} />
            ))}
            {Array.from({ length: d.assists }).map((_, i) => (
              <BootIcon key={`a${i}`} width={iconSize} height={iconSize} className={s.iconAssist} />
            ))}
            {d.goals === 0 && d.assists === 0 && <span className={s.empty}>·</span>}
          </div>
          <span className={s.barLabel}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Barras horizontais de magnitude (uma cor, rótulo à esquerda, valor à direita). */
function HBars({ items, suffix = '' }: { items: { label: string; value: number }[]; suffix?: string }) {
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
