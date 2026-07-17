import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Avatar, Badge, Button, Card, EmptyState, Loading, Page, PageTitle } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useAuth } from '@/features/auth/useAuth';
import { useProfilesList } from '@/features/profile/profileHooks';
import {
  useAddSessionPlayer,
  useCrossbarSession,
  useRecordTurn,
  useRemoveSessionPlayer,
  useSessionPlayers,
  useStartCrossbarSession,
  type ChallengeSession,
  type SessionPlayerWithProfile,
} from '../challengeHooks';
import { spotLabel, variantFromCount } from './crossbarSpots';
import s from './CrossbarSessionPage.module.css';

export function CrossbarSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useCrossbarSession(sessionId);

  if (isLoading) return <Loading />;

  if (!session) {
    return (
      <Page>
        <EmptyState
          title="Sessão não encontrada"
          description="Pode ter sido removida."
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
        <PageTitle>🎯 Crossbar Challenge</PageTitle>
      </div>

      {session.status === 'setup' && <SetupView session={session} />}
      {session.status === 'active' && <ActiveView session={session} />}
      {session.status === 'finished' && <FinishedView session={session} />}
    </Page>
  );
}

// -----------------------------------------------------------------------------
// SETUP — escolher jogadores e começar.
// -----------------------------------------------------------------------------
function SetupView({ session }: { session: ChallengeSession }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: profiles } = useProfilesList();
  const { data: players } = useSessionPlayers(session.id);
  const addPlayer = useAddSessionPlayer(session.id);
  const removePlayer = useRemoveSessionPlayer(session.id);
  const startSession = useStartCrossbarSession(session.id);

  const isOwner = session.created_by === user?.id;
  const variant = variantFromCount(session.spot_count);
  const chosenIds = new Set((players ?? []).map((p) => p.player_id));
  const available = (profiles ?? []).filter((p) => !chosenIds.has(p.id));

  async function start() {
    try {
      await startSession.mutateAsync();
    } catch {
      toast.show('São precisos pelo menos 2 jogadores.', 'error');
    }
  }

  return (
    <div className={s.body}>
      <Card>
        <div className={s.setupHead}>
          <h2 className={s.cardTitle}>Jogadores ({players?.length ?? 0})</h2>
          <Badge tone="sky">Versão {variant === 'quick' ? 'rápida' : 'longa'} · {session.spot_count} posições</Badge>
        </div>

        {players && players.length > 0 ? (
          <ul className={s.chosenList}>
            {players.map((p) => (
              <li key={p.id} className={s.chosenItem}>
                <span className={s.chosenName}>
                  <Avatar name={p.profile?.name} src={p.profile?.photo_url} size="sm" />
                  {p.profile?.name ?? 'Jogador'}
                </span>
                {isOwner && (
                  <Button variant="ghost" size="sm" onClick={() => removePlayer.mutate(p.id)}>
                    Remover
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.muted}>Ainda sem jogadores.</p>
        )}
      </Card>

      {isOwner && (
        <Card>
          <h2 className={s.cardTitle}>Adicionar</h2>
          {available.length === 0 ? (
            <p className={s.muted}>Todos os jogadores já foram adicionados.</p>
          ) : (
            <div className={s.addGrid}>
              {available.map((p) => (
                <button key={p.id} className={s.addChip} onClick={() => addPlayer.mutate(p.id)}>
                  <Avatar name={p.name} src={p.photo_url} size="sm" />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {isOwner ? (
        <Button
          block
          size="lg"
          onClick={start}
          loading={startSession.isPending}
          disabled={(players?.length ?? 0) < 2}
        >
          Sortear ordem e começar
        </Button>
      ) : (
        <Alert kind="info">Só o organizador da sessão pode geri-la.</Alert>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// ACTIVE — turno a turno.
// -----------------------------------------------------------------------------
function ActiveView({ session }: { session: ChallengeSession }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data: players } = useSessionPlayers(session.id);
  const recordTurn = useRecordTurn(session);

  const isOwner = session.created_by === user?.id;
  const variant = variantFromCount(session.spot_count);
  const ordered = useMemo(() => [...(players ?? [])].sort((a, b) => a.turn_order - b.turn_order), [players]);
  const current = ordered.find((p) => p.turn_order === session.current_turn_index) ?? ordered[0];
  const currentSpot = current ? spotLabel(variant, current.current_spot) : null;

  async function record(hit: boolean) {
    try {
      await recordTurn.mutateAsync(hit);
    } catch {
      toast.show('Não foi possível registar o remate.', 'error');
    }
  }

  return (
    <div className={s.body}>
      <Card className={s.turnCard}>
        <p className={s.turnLabel}>É a vez de</p>
        <div className={s.turnPlayer}>
          <Avatar name={current?.profile?.name} src={current?.profile?.photo_url} size="lg" />
          <span className={s.turnName}>{current?.profile?.name ?? 'Jogador'}</span>
        </div>
        <div className={s.spotBox}>
          <span className={s.spotHint}>Posição {(current?.current_spot ?? 0) + 1}/{session.spot_count}</span>
          <span className={s.spotName}>{currentSpot}</span>
        </div>

        {isOwner ? (
          <div className={s.turnActions}>
            <Button variant="secondary" size="lg" onClick={() => record(false)} loading={recordTurn.isPending}>
              Falhou
            </Button>
            <Button size="lg" onClick={() => record(true)} loading={recordTurn.isPending}>
              Acertou 🎯
            </Button>
          </div>
        ) : (
          <Alert kind="info">Só o organizador regista os remates.</Alert>
        )}
      </Card>

      <ProgressList players={ordered} session={session} currentId={current?.id} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// FINISHED — vencedor.
// -----------------------------------------------------------------------------
function FinishedView({ session }: { session: ChallengeSession }) {
  const navigate = useNavigate();
  const { data: players } = useSessionPlayers(session.id);
  const ordered = useMemo(() => [...(players ?? [])].sort((a, b) => a.turn_order - b.turn_order), [players]);
  const winner = ordered.find((p) => p.player_id === session.winner_id);

  return (
    <div className={s.body}>
      <Card className={s.winnerCard}>
        <p className={s.winnerLabel}>Vencedor</p>
        <div className={s.turnPlayer}>
          <Avatar name={winner?.profile?.name} src={winner?.profile?.photo_url} size="xl" />
          <span className={s.winnerName}>🏆 {winner?.profile?.name ?? 'Jogador'}</span>
        </div>
        <p className={s.muted}>+1 no ranking do Crossbar</p>
      </Card>

      <ProgressList players={ordered} session={session} currentId={undefined} />

      <Button block onClick={() => navigate('/challenges')}>
        Voltar aos desafios
      </Button>
    </div>
  );
}

// -----------------------------------------------------------------------------
function ProgressList({
  players,
  session,
  currentId,
}: {
  players: SessionPlayerWithProfile[];
  session: ChallengeSession;
  currentId: string | undefined;
}) {
  return (
    <div>
      <h2 className={s.sectionTitle}>Progresso</h2>
      <ul className={s.progressList}>
        {players.map((p) => (
          <li key={p.id} className={[s.progressItem, p.id === currentId ? s.progressActive : ''].filter(Boolean).join(' ')}>
            <span className={s.chosenName}>
              <Avatar name={p.profile?.name} src={p.profile?.photo_url} size="sm" />
              {p.profile?.name ?? 'Jogador'}
            </span>
            <span className={s.progressDots}>
              {Array.from({ length: session.spot_count }, (_, i) => (
                <span key={i} className={i < p.current_spot ? s.dotHit : s.dot} />
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
