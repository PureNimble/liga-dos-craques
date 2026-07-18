import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Avatar, Button, Card, EmptyState, Loading, Page, PageTitle } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useAuth } from '@/features/auth/useAuth';
import {
  useCrossbarSession,
  usePenaltyRecordTurn,
  useSessionPlayers,
  type ChallengeSession,
  type SessionPlayerWithProfile,
} from '../challengeHooks';
import { OrderReveal } from '../crossbar/OrderReveal';
import { PenaltyGoal } from './PenaltyGoal';
import { useZoneSpin } from './useZoneSpin';
import { PENALTY_MODES, ZONE_LABELS, allFilled, filledCount } from './penaltyModes';
import type { PenaltyMode } from '@/types/database';
import cb from '../crossbar/CrossbarSessionPage.module.css';
import s from './PenaltySessionPage.module.css';

const byOrder = (a: SessionPlayerWithProfile, b: SessionPlayerWithProfile) => a.turn_order - b.turn_order;
const penaltyMode = (session: ChallengeSession): PenaltyMode =>
  session.mode === 'crossbar' ? 'pen_goals' : session.mode;

export function PenaltySessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isLoading } = useCrossbarSession(sessionId);
  const [justStarted, setJustStarted] = useState(
    Boolean((location.state as { justStarted?: boolean } | null)?.justStarted),
  );
  const [winnerName, setWinnerName] = useState<string | null>(null);

  useEffect(() => {
    if ((location.state as { justStarted?: boolean } | null)?.justStarted) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (winnerName) return <FinishedView winnerName={winnerName} />;
  if (isLoading) return <Loading />;

  if (!session) {
    return (
      <Page>
        <EmptyState
          title="Sessão não encontrada"
          description="Pode já ter terminado ou sido removida."
          action={<Button onClick={() => navigate('/challenges')}>Voltar aos desafios</Button>}
        />
      </Page>
    );
  }

  const mode = PENALTY_MODES[penaltyMode(session)];

  return (
    <Page>
      <div>
        <button className={cb.back} onClick={() => navigate('/challenges')}>
          ← Desafios
        </button>
        <PageTitle>
          {mode.icon} Penáltis · {mode.label}
        </PageTitle>
      </div>

      {session.status === 'active' &&
        (justStarted ? (
          <OrderRevealGate session={session} onDone={() => setJustStarted(false)} />
        ) : (
          <ActiveView session={session} onFinished={setWinnerName} />
        ))}

      {session.status !== 'active' && (
        <EmptyState
          title="Sessão não iniciada"
          description="Cria uma nova sessão a partir dos desafios."
          action={<Button onClick={() => navigate('/challenges')}>Voltar aos desafios</Button>}
        />
      )}
    </Page>
  );
}

function OrderRevealGate({ session, onDone }: { session: ChallengeSession; onDone: () => void }) {
  const { data: players } = useSessionPlayers(session.id);
  const ordered = useMemo(() => [...(players ?? [])].sort(byOrder), [players]);
  if (!players) return <Loading />;
  return <OrderReveal players={ordered} onDone={onDone} />;
}

// -----------------------------------------------------------------------------
// ACTIVE — baliza (exceto pen_goals) + prompt + board.
// -----------------------------------------------------------------------------
function ActiveView({
  session,
  onFinished,
}: {
  session: ChallengeSession;
  onFinished: (winnerName: string) => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: players } = useSessionPlayers(session.id);
  const recordTurn = usePenaltyRecordTurn(session);

  const mode = penaltyMode(session);
  const info = PENALTY_MODES[mode];
  const isOwner = session.created_by === user?.id;
  const isSuddenDeath = session.phase === 'sudden_death';
  const ordered = useMemo(() => [...(players ?? [])].sort(byOrder), [players]);
  const current = isSuddenDeath
    ? ordered.find((p) => !p.eliminated && !p.sd_shot) ?? ordered.find((p) => !p.eliminated)
    : ordered.find((p) => p.turn_order === session.current_turn_index) ?? ordered[0];

  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  // Zera a escolha quando muda o rematador.
  useEffect(() => setSelectedZone(null), [current?.player_id]);

  const showGoal = info.usesGoal && !isSuddenDeath;
  const targetZone = mode === 'pen_target' ? current?.target ?? null : null;
  const needsZone = info.picksZone && !isSuddenDeath;

  // Animação do sorteio da zona (pen_target): joga uma vez por vez de cada jogador.
  // A mesma PenaltyGoal fica montada — só muda a prop `target` — para não "piscar".
  const revealKey = current ? `${current.player_id}:${session.round}` : '';
  const { displayZone, spinning, skip } = useZoneSpin(
    revealKey,
    targetZone,
    mode === 'pen_target' && !isSuddenDeath,
  );

  const canRecord =
    isOwner && !recordTurn.isPending && !spinning && (!needsZone || selectedZone !== null);

  async function record(hit: boolean) {
    const zone = mode === 'pen_target' ? targetZone : info.picksZone ? selectedZone : null;
    try {
      const res = await recordTurn.mutateAsync({ hit, zone });
      if (res.status === 'finished') {
        const w = ordered.find((p) => p.player_id === res.winner_id);
        onFinished(w?.profile?.name ?? 'Jogador');
      }
    } catch {
      toast.show('Não foi possível registar o remate.', 'error');
    }
  }

  return (
    <div className={cb.body}>
      <div className={[cb.phaseBar, isSuddenDeath ? cb.phaseSd : ''].filter(Boolean).join(' ')}>
        {isSuddenDeath
          ? '🥅 Morte súbita'
          : `Ronda ${session.round}${session.max_rounds ? `/${session.max_rounds}` : ''}`}
      </div>

      {isSuddenDeath ? (
        <Card className={cb.sdShooter}>
          <Avatar name={current?.profile?.name} src={current?.profile?.photo_url} size="xl" />
          <span className={cb.sdShooterName}>{current?.profile?.name ?? 'Jogador'}</span>
        </Card>
      ) : (
        showGoal && (
          <div className={s.goalWrap}>
            <PenaltyGoal
              filled={mode === 'pen_zones' ? current?.zones ?? 0 : 0}
              target={mode === 'pen_target' ? displayZone : null}
              selected={info.picksZone ? selectedZone : null}
              onSelect={info.picksZone && isOwner && !spinning ? setSelectedZone : undefined}
            />
            {mode === 'pen_target' &&
              (spinning ? (
                <div className={s.spinRow}>
                  <p className={s.zoneHint}>A sortear a zona…</p>
                  <Button variant="ghost" size="sm" onClick={skip}>
                    Saltar
                  </Button>
                </div>
              ) : (
                targetZone !== null && (
                  <p className={s.zoneHint}>
                    Alvo: <strong>{ZONE_LABELS[targetZone]}</strong>
                  </p>
                )
              ))}
            {info.picksZone && (
              <p className={s.zoneHint}>
                {selectedZone === null ? (
                  'Escolhe a zona a rematar.'
                ) : (
                  <>
                    Zona: <strong>{ZONE_LABELS[selectedZone]}</strong>
                  </>
                )}
              </p>
            )}
          </div>
        )
      )}

      <div className={cb.prompt}>
        <span className={cb.promptTurn}>
          É a vez de <strong>{current?.profile?.name ?? 'Jogador'}</strong>
        </span>
        <span className={cb.promptSpot}>
          {isSuddenDeath
            ? 'Acerta para continuar'
            : mode === 'pen_zones'
              ? `${filledCount(current?.zones ?? 0)}/6 zonas`
              : `${current?.goals ?? 0} golos`}
        </span>
      </div>

      {isOwner ? (
        <div className={cb.turnActions}>
          <button className={cb.missBtn} onClick={() => record(false)} disabled={!canRecord}>
            <span className={cb.btnIcon}>✗</span> Falhou
          </button>
          <button className={cb.hitBtn} onClick={() => record(true)} disabled={!canRecord}>
            <span className={cb.btnIcon}>⚽</span> Marcou
          </button>
        </div>
      ) : (
        <Alert kind="info">Só o organizador regista os remates.</Alert>
      )}

      <PlayerBoard players={ordered} mode={mode} currentId={current?.player_id} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Board com o estado de cada jogador (golos ou zonas preenchidas).
// -----------------------------------------------------------------------------
function PlayerBoard({
  players,
  mode,
  currentId,
}: {
  players: SessionPlayerWithProfile[];
  mode: PenaltyMode;
  currentId?: string;
}) {
  const isZones = mode === 'pen_zones';
  return (
    <div>
      <h2 className={cb.cardTitle}>Estado</h2>
      <ul className={cb.board}>
        {players.map((p, i) => (
          <li
            key={p.id}
            className={[
              cb.boardRow,
              p.player_id === currentId ? cb.boardRowActive : '',
              p.eliminated ? cb.boardRowOut : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={cb.boardPos}>{i + 1}</span>
            <Avatar name={p.profile?.name} src={p.profile?.photo_url} size="sm" />
            <span className={cb.boardName}>{p.profile?.name ?? 'Jogador'}</span>
            {isZones ? (
              <>
                <span className={cb.boardDots}>
                  {Array.from({ length: 6 }, (_, k) => (
                    <span key={k} className={(p.zones & (1 << k)) !== 0 ? cb.dotHit : cb.dot} />
                  ))}
                </span>
                <span className={cb.boardCount}>
                  {p.eliminated ? 'fora' : allFilled(p.zones) ? '✓' : `${filledCount(p.zones)}/6`}
                </span>
              </>
            ) : (
              <span className={s.goalsCount}>
                {p.eliminated ? 'fora' : p.goals} <span>golos</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FinishedView({ winnerName }: { winnerName: string }) {
  const navigate = useNavigate();
  return (
    <Page>
      <div className={cb.body}>
        <Card className={cb.winnerCard}>
          <p className={cb.winnerLabel}>Vencedor</p>
          <span className={cb.winnerName}>🏆 {winnerName}</span>
          <p className={cb.muted}>+1 no ranking dos Penáltis</p>
        </Card>
        <Button block onClick={() => navigate('/challenges')}>
          Voltar aos desafios
        </Button>
      </div>
    </Page>
  );
}
