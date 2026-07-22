import { Card, LockOverlay } from '@/shared/components/ui';
import { BallIcon, BootIcon } from '@/shared/components/ui/icons';
import {
  useRatingTrend,
  useContributions,
  useXpBreakdown,
  MIN_GAMES_FOR_STATS,
  statsLockMessage,
  type GameContribution,
  type RatingPoint,
  type RecentGame,
} from './statsHooks';
import { RatingTrend } from './RatingTrend';
import { RecentMatchesCard } from './RecentMatches';
import s from './PlayerCharts.module.css';

// Dados de mentira: só para o efeito desfocado do estado bloqueado.
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
  { label: 'Jogos', value: 120 },
  { label: 'Golos', value: 80 },
  { label: 'Assistências', value: 50 },
  { label: 'Conquistas', value: 30 },
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

/** Cartões de gráficos do jogador — devolvidos como fragmento para caber num grid. */
export function PlayerCharts({
  playerId,
  games,
  own = false,
}: {
  playerId: string;
  games: number;
  own?: boolean;
}) {
  const { data: trend } = useRatingTrend(playerId);
  const { data: contrib } = useContributions(playerId);
  const { data: xp } = useXpBreakdown(playerId);

  const hasContrib = (contrib ?? []).some((c) => c.goals > 0 || c.assists > 0);

  // Bloqueado até jogar o mínimo de jogos: cartões reais com dados de mentira,
  // sob uma única sobreposição bem desfocada.
  if (games < MIN_GAMES_FOR_STATS) {
    return (
      <LockOverlay locked className={s.lockedWrap} message={statsLockMessage(own)}>
        <div className={s.lockedGrid}>
          <RecentMatchesCard data={MOCK_RECENT} />
          <Card className={s.chartCard}>
            <ChartHead title="Forma" hint={`Últimos ${MOCK_TREND.length} jogos`} />
            <div className={s.trendRow}>
              <RatingTrend points={MOCK_TREND} />
            </div>
          </Card>
          <Card>
            <ChartHead title="Golos e assistências" hint="Por jogo" />
            <ContributionBars data={MOCK_CONTRIB} />
            <div className={s.legend}>
              <span className={s.legendItem}>
                <BallIcon width={14} height={14} className={s.iconGoal} /> Golos
              </span>
              <span className={s.legendItem}>
                <BootIcon width={14} height={14} className={s.iconAssist} /> Assist.
              </span>
            </div>
          </Card>
          <Card className={s.chartCard}>
            <ChartHead title="XP por fonte" hint="De onde vem o XP" />
            <HBars items={MOCK_XP} suffix=" XP" />
          </Card>
        </div>
      </LockOverlay>
    );
  }

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
        <Card className={s.chartCard}>
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

/**
 * Pictograma por jogo: uma barra única — bolas (golos) em baixo, botas (assists)
 * por cima.
 *
 * Princípio ISOTYPE: o tamanho do ícone é CONSTANTE, só o número varia. Encolher
 * o ícone até caber (o que se fazia antes, até 6px) tornava-o ilegível e, como o
 * tamanho saía do jogo com mais contribuições, mudava de perfil para perfil — dois
 * pictogramas deixavam de ser comparáveis, que é o objetivo do gráfico.
 *
 * Com o ícone fixo é preciso um limite: a coluna tem BUDGET lugares, repartidos
 * entre golos e assists. Quem não couber nos seus lugares põe o último a valer os
 * que sobram (contador com o número dentro). O número é exato — ao contrário de
 * uma escala (1 ícone = 2), não obriga a fazer contas nem esconde nada.
 */
const ICON = 16;
const STACK_GAP = 2;
/** Lugares por coluna. A coluna nunca passa disto — é o limite que faltava. */
const BUDGET = 5;
/** Altura da caixa de ícones (px), aplicada inline em `.stack`. */
const STACK_BOX = BUDGET * ICON + (BUDGET - 1) * STACK_GAP;

/**
 * Reparte os lugares: os GOLOS têm prioridade — servem-se primeiro e só o que
 * sobra vai para as assists (guardando 1 lugar para elas, se existirem, para não
 * desaparecerem). Repartir pelo maior fazia com que 2 golos + 5 assists mostrasse
 * ZERO bolas (os 2 golos colapsavam num contador) — logo o que mais interessa.
 */
function allocate(goals: number, assists: number) {
  const gs = Math.min(goals, BUDGET - (assists > 0 ? 1 : 0));
  return { gs, as: Math.min(assists, BUDGET - gs) };
}

/**
 * Como se desenha uma fila em `slots` lugares: se o valor cabe, são todos ícones
 * simples (1 = 1). Se não cabe, o último é um contador que vale os que sobram —
 * incluindo-se a si próprio, por isso `plain + count` dá sempre o valor exato.
 */
function run(v: number, slots: number) {
  if (v <= slots) return { plain: v, count: 0 };
  return { plain: slots - 1, count: v - (slots - 1) };
}

function ContributionBars({ data }: { data: GameContribution[] }) {
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
              title={`${d.goals} golo${d.goals === 1 ? '' : 's'} · ${d.assists} assist.`}
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

/**
 * Contador: ocupa um lugar de ícone e diz quantos vale. Fica o aro da bola (mesmo
 * círculo, mesma cor) e o número ocupa o miolo todo.
 *
 * Os raios da `BallIcon` saem de propósito: a 16px não cabem aro + 5 raios + um
 * número — sobravam ~4px para o algarismo e o conjunto virava borrão. Os raios
 * são decoração, o número é a razão de ser do contador; a silhueta redonda (e as
 * bolas normais logo por baixo) chegam para se ler como bola.
 */
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
      {/* O que aperta o número dentro de um círculo não é a largura, são os
          CANTOS: a meia-diagonal da caixa do texto ≈ 0.45·fontSize com 1
          algarismo, 0.66 com 2 e 0.90 com 3. O raio útil é 8.25 (9 menos meio
          traço) — com 11 os "17" iam aos 7.2 e encostavam ao aro. Estes tamanhos
          mantêm a diagonal em ~6, que é a folga que faltava. */}
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

/** Barras horizontais de magnitude (uma cor, rótulo à esquerda, valor à direita). */
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
