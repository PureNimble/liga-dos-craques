import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Avatar, Button, Card, EmptyState, Loading, Page, PageTitle } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { TargetIcon, TrophyIcon, XCircleIcon } from '@/shared/components/ui/icons';
import { useAuth } from '@/features/auth/useAuth';
import {
  useCrossbarSession,
  useRecordTurn,
  useSessionPlayers,
  type ChallengeSession,
  type SessionPlayerWithProfile,
} from '../challengeHooks';
import { CrossbarField } from './CrossbarField';
import { OrderReveal } from './OrderReveal';
import { spotLabel, variantFromCount } from './crossbarSpots';
import s from './CrossbarSessionPage.module.css';

const byOrder = (a: SessionPlayerWithProfile, b: SessionPlayerWithProfile) => a.turn_order - b.turn_order;

export function CrossbarSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isLoading } = useCrossbarSession(sessionId);
  const [justStarted, setJustStarted] = useState(
    Boolean((location.state as { justStarted?: boolean } | null)?.justStarted),
  );
  const [winnerName, setWinnerName] = useState<string | null>(null);

  // Consome o "justStarted" uma vez: limpa-o do histórico para um reload não
  // repetir a animação de sorteio.
  useEffect(() => {
    if ((location.state as { justStarted?: boolean } | null)?.justStarted) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O jogo terminou nesta sessão do ecrã → a sessão já foi apagada na BD.
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

  return (
    <Page>
      <div>
        <button className={s.back} onClick={() => navigate('/challenges')}>
          ← Desafios
        </button>
        <PageTitle>Crossbar Challenge</PageTitle>
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

// -----------------------------------------------------------------------------
// Animação de sorteio (mostra a ordem antes do jogo).
// -----------------------------------------------------------------------------
function OrderRevealGate({ session, onDone }: { session: ChallengeSession; onDone: () => void }) {
  const { data: players } = useSessionPlayers(session.id);
  const ordered = useMemo(() => [...(players ?? [])].sort(byOrder), [players]);
  if (!players) return <Loading />;
  return <OrderReveal players={ordered} onDone={onDone} />;
}

// -----------------------------------------------------------------------------
// ACTIVE — campo + prompt do remate + board.
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
  const recordTurn = useRecordTurn(session);

  const isOwner = session.created_by === user?.id;
  const isSuddenDeath = session.phase === 'sudden_death';
  const variant = variantFromCount(session.spot_count);
  const ordered = useMemo(() => [...(players ?? [])].sort(byOrder), [players]);
  const current = isSuddenDeath
    ? ordered.find((p) => !p.eliminated && !p.sd_shot) ?? ordered.find((p) => !p.eliminated)
    : ordered.find((p) => p.turn_order === session.current_turn_index) ?? ordered[0];
  const currentSpot = current ? spotLabel(variant, current.current_spot) : null;

  async function record(hit: boolean) {
    try {
      const res = await recordTurn.mutateAsync(hit);
      if (res.status === 'finished') {
        const w = ordered.find((p) => p.player_id === res.winner_id);
        onFinished(w?.profile?.name ?? 'Jogador');
      }
    } catch {
      toast.show('Não foi possível registar o remate.', 'error');
    }
  }

  return (
    <div className={s.body}>
      <div className={[s.phaseBar, isSuddenDeath ? s.phaseSd : ''].filter(Boolean).join(' ')}>
        {isSuddenDeath
          ? 'Morte súbita'
          : `Ronda ${session.round}${session.max_rounds ? `/${session.max_rounds}` : ''}`}
      </div>

      {isSuddenDeath ? (
        <Card className={s.sdShooter}>
          <Avatar name={current?.profile?.name} src={current?.profile?.photo_url} size="xl" />
          <span className={s.sdShooterName}>{current?.profile?.name ?? 'Jogador'}</span>
        </Card>
      ) : (
        <CrossbarField
          spotCount={session.spot_count}
          players={ordered}
          currentPlayerId={current?.player_id}
        />
      )}

      <div className={s.prompt}>
        <span className={s.promptTurn}>
          É a vez de <strong>{current?.profile?.name ?? 'Jogador'}</strong>
        </span>
        <span className={s.promptSpot}>
          {isSuddenDeath
            ? 'Acerta para continuar'
            : `${currentSpot} · ${(current?.current_spot ?? 0) + 1}/${session.spot_count}`}
        </span>
      </div>

      {isOwner ? (
        <div className={s.turnActions}>
          <button className={s.missBtn} onClick={() => record(false)} disabled={recordTurn.isPending}>
            <XCircleIcon className={s.btnIcon} /> Falhou
          </button>
          <button className={s.hitBtn} onClick={() => record(true)} disabled={recordTurn.isPending}>
            <TargetIcon className={s.btnIcon} /> Acertou
          </button>
        </div>
      ) : (
        <Alert kind="info">Só o organizador regista os remates.</Alert>
      )}

      <PlayerBoard players={ordered} spotCount={session.spot_count} currentId={current?.player_id} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Board com o estado de cada jogador (posição atual e progresso).
// -----------------------------------------------------------------------------
function PlayerBoard({
  players,
  spotCount,
  currentId,
}: {
  players: SessionPlayerWithProfile[];
  spotCount: number;
  currentId?: string;
}) {
  return (
    <div>
      <h2 className={s.sectionTitle}>Estado</h2>
      <ul className={s.board}>
        {players.map((p, i) => {
          const done = Math.min(p.current_spot, spotCount);
          return (
            <li
              key={p.id}
              className={[
                s.boardRow,
                p.player_id === currentId ? s.boardRowActive : '',
                p.eliminated ? s.boardRowOut : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={s.boardPos}>{i + 1}</span>
              <Avatar name={p.profile?.name} src={p.profile?.photo_url} size="sm" />
              <span className={s.boardName}>{p.profile?.name ?? 'Jogador'}</span>
              <span className={s.boardDots}>
                {Array.from({ length: spotCount }, (_, k) => (
                  <span key={k} className={k < done ? s.dotHit : s.dot} />
                ))}
              </span>
              <span className={s.boardCount}>
                {p.eliminated ? 'fora' : `${done}/${spotCount}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// -----------------------------------------------------------------------------
// FINISHED — vencedor (a sessão já foi apagada; fica só o +1 no ranking).
// -----------------------------------------------------------------------------
function FinishedView({ winnerName }: { winnerName: string }) {
  const navigate = useNavigate();
  return (
    <Page>
      <div className={s.body}>
        <Card className={s.winnerCard}>
          <p className={s.winnerLabel}>Vencedor</p>
          <span className={s.winnerName}>
            <TrophyIcon className={s.winnerIcon} /> {winnerName}
          </span>
          <p className={s.muted}>+1 no ranking do Crossbar</p>
        </Card>
        <Button block onClick={() => navigate('/challenges')}>
          Voltar aos desafios
        </Button>
      </div>
    </Page>
  );
}
