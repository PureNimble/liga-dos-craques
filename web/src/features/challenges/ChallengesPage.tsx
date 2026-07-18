import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  IconButton,
  Input,
  Page,
  PageTitle,
  PillTabs,
  Select,
  type BadgeTone,
} from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { CloseIcon } from '@/shared/components/ui/icons';
import { useAuth } from '@/features/auth/useAuth';
import { useProfilesList } from '@/features/profile/profileHooks';
import { RankingList, type RankingRow } from '@/features/rankings/RankingList';
import { formatDate, formatDateShort } from '@/shared/lib/datetime';
import type { ChallengeResult, ChallengeSessionStatus } from '@/types/database';
import {
  useAddChallengeAttempt,
  useChallengeAttempts,
  useChallengeLeaderboard,
  useChallenges,
  useChallengeSessions,
  useDeleteSession,
  type Challenge,
  type ChallengeLeaderboardRow,
} from './challengeHooks';
import { CROSSBAR_VARIANT_LABEL, spotCount, type CrossbarVariant } from './crossbar/crossbarSpots';
import s from './ChallengesPage.module.css';

const CROSSBAR_CODE = 'crossbar';

export function ChallengesPage() {
  const { data: challenges } = useChallenges();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = challenges?.find((c) => c.id === selectedId) ?? challenges?.[0];

  return (
    <Page>
      <div>
        <PageTitle>Desafios</PageTitle>
        <p className={s.note}>Área separada — não conta para as estatísticas dos jogos.</p>
      </div>

      {challenges && (
        <PillTabs<number>
          value={selected?.id ?? -1}
          onChange={setSelectedId}
          items={challenges.map((c) => ({
            value: c.id,
            label: (
              <>
                {c.icon} {c.label}
              </>
            ),
          }))}
        />
      )}

      {selected && <ChallengeView challenge={selected} />}
    </Page>
  );
}

function bestValue(row: ChallengeLeaderboardRow): number | null {
  if (row.scoring_type === 'versus' || row.challenge_code === CROSSBAR_CODE) return row.wins;
  if (row.scoring_type === 'lower_better') return row.best_low;
  return row.best_high;
}

function ChallengeView({ challenge }: { challenge: Challenge }) {
  const isVersus = challenge.scoring_type === 'versus';
  const isCrossbar = challenge.code === CROSSBAR_CODE;
  // Desafios baseados em vitórias (1v1 e o Crossbar em sessão) mostram nº de vitórias.
  const isWinsBased = isVersus || isCrossbar;
  const { data: leaderboard } = useChallengeLeaderboard(challenge.id);
  const { data: attempts } = useChallengeAttempts(challenge.id);

  const sorted = useMemo(() => {
    const rows = [...(leaderboard ?? [])];
    rows.sort((a, b) => {
      const va = bestValue(a);
      const vb = bestValue(b);
      if (va === null) return 1;
      if (vb === null) return -1;
      return challenge.scoring_type === 'lower_better' ? va - vb : vb - va;
    });
    return rows;
  }, [leaderboard, challenge.scoring_type]);

  const record = sorted[0];

  const rankingRows: RankingRow[] = sorted.map((r) => ({
    player_id: r.player_id,
    name: r.name,
    photo_url: r.photo_url,
    value: isVersus ? `${r.wins}V` : isCrossbar ? `${r.wins}` : `${bestValue(r) ?? '—'}`,
    sub: isVersus
      ? `${r.wins}V-${r.losses}D · ${r.attempts} jogos`
      : isCrossbar
        ? undefined
        : `${r.attempts} tentativas`,
  }));

  return (
    <div className={s.body}>
      {/* Recorde (não no crossbar — o ranking já mostra as vitórias). */}
      {!isCrossbar && (
        <Card className={s.recordCard}>
          <p className={s.recordLabel}>Recorde</p>
          {record ? (
            <p className={s.recordValue}>
              {isWinsBased ? `${record.wins} vitórias` : `${bestValue(record)}`}{' '}
              <span className={s.recordSub}>· {record.name}</span>
            </p>
          ) : (
            <p className={s.recordEmpty}>Ainda sem registos.</p>
          )}
        </Card>
      )}

      {isCrossbar ? <CrossbarEntry challenge={challenge} /> : <AddAttemptForm challenge={challenge} />}

      <div>
        <h2 className={s.sectionTitle}>Ranking</h2>
        <RankingList rows={rankingRows} />
      </div>

      {!isCrossbar && attempts && attempts.length > 0 && (
        <div>
          <h2 className={s.sectionTitle}>Histórico recente</h2>
          <ul className={s.historyList}>
            {attempts.map((a) => (
              <li key={a.id} className={s.historyItem}>
                <span className={s.historyName}>
                  {a.profile?.name ?? 'Jogador'}
                  {a.opponent?.name ? ` vs ${a.opponent.name}` : ''}
                </span>
                <span className={s.historyMeta}>
                  {isWinsBased ? resultLabel(a.result) : a.score}{' '}
                  <span className={s.historyDate}>· {formatDate(a.played_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function resultLabel(r: ChallengeResult) {
  return r === 'win' ? 'Vitória' : r === 'loss' ? 'Derrota' : r === 'draw' ? 'Empate' : '—';
}

const SESSION_STATUS_LABEL: Record<ChallengeSessionStatus, string> = {
  setup: 'Por começar',
  active: 'A decorrer',
  finished: 'Terminada',
};
const SESSION_STATUS_TONE: Record<ChallengeSessionStatus, BadgeTone> = {
  setup: 'gray',
  active: 'green',
  finished: 'indigo',
};

/** Entrada do Crossbar: escolhe a versão (cria no setup) e lista as sessões a decorrer. */
function CrossbarEntry({ challenge }: { challenge: Challenge }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const deleteSession = useDeleteSession(challenge.id);
  const { data: sessions } = useChallengeSessions(challenge.id);

  async function remove(sessionId: string) {
    const ok = await confirm({ title: 'Apagar esta sessão?', danger: true });
    if (ok) deleteSession.mutate(sessionId);
  }

  return (
    <>
      <Card>
        <h2 className={s.cardTitle}>Nova sessão de Crossbar</h2>
        <div className={s.versionGrid}>
          {(['quick', 'long'] as CrossbarVariant[]).map((v) => (
            <button
              key={v}
              className={s.versionCard}
              onClick={() => navigate(`/challenges/crossbar/new?v=${v}`)}
            >
              <span className={s.versionName}>{CROSSBAR_VARIANT_LABEL[v]}</span>
              <span className={s.versionSpots}>{spotCount(v)} posições</span>
            </button>
          ))}
        </div>
      </Card>

      {sessions && sessions.length > 0 && (
        <div>
          <h2 className={s.sectionTitle}>Sessões a decorrer</h2>
          <ul className={s.historyList}>
            {sessions.map((sess) => (
              <li key={sess.id} className={s.sessionItem}>
                <button
                  className={s.sessionMain}
                  onClick={() => navigate(`/challenges/crossbar/${sess.id}`)}
                >
                  <Badge tone={SESSION_STATUS_TONE[sess.status]}>
                    {SESSION_STATUS_LABEL[sess.status]}
                  </Badge>
                  <span className={s.sessionMeta}>
                    {sess.player_count} {sess.player_count === 1 ? 'jogador' : 'jogadores'} ·{' '}
                    {sess.spot_count} posições · {formatDateShort(sess.created_at)}
                  </span>
                </button>
                {sess.created_by === user?.id && (
                  <IconButton label="Apagar sessão" onClick={() => remove(sess.id)}>
                    <CloseIcon />
                  </IconButton>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function AddAttemptForm({ challenge }: { challenge: Challenge }) {
  const { user } = useAuth();
  const { data: profiles } = useProfilesList();
  const addAttempt = useAddChallengeAttempt();
  const isVersus = challenge.scoring_type === 'versus';

  const [playerId, setPlayerId] = useState(user?.id ?? '');
  const [opponentId, setOpponentId] = useState('');
  const [score, setScore] = useState('');
  const [result, setResult] = useState<ChallengeResult>('win');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!playerId) {
      setError('Escolhe o jogador.');
      return;
    }
    if (isVersus && !opponentId) {
      setError('Escolhe o adversário.');
      return;
    }
    if (isVersus && opponentId === playerId) {
      setError('O adversário tem de ser diferente.');
      return;
    }
    try {
      await addAttempt.mutateAsync({
        challenge_id: challenge.id,
        player_id: playerId,
        opponent_id: isVersus ? opponentId : null,
        score: isVersus ? null : score === '' ? null : Number(score),
        result: isVersus ? result : 'na',
      });
      setScore('');
    } catch {
      setError('Não foi possível registar a tentativa.');
    }
  }

  return (
    <Card>
      <h2 className={s.cardTitle}>Registar tentativa</h2>
      {error && (
        <div className={s.slotTop}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className={s.form}>
        <Field label="Jogador" htmlFor="ch-player">
          <Select id="ch-player" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">Escolher…</option>
            {profiles?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        {isVersus ? (
          <>
            <Field label="Adversário" htmlFor="ch-opp">
              <Select id="ch-opp" value={opponentId} onChange={(e) => setOpponentId(e.target.value)}>
                <option value="">Escolher…</option>
                {profiles
                  ?.filter((p) => p.id !== playerId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Resultado" htmlFor="ch-res">
              <Select
                id="ch-res"
                value={result}
                onChange={(e) => setResult(e.target.value as ChallengeResult)}
              >
                <option value="win">Vitória</option>
                <option value="loss">Derrota</option>
                <option value="draw">Empate</option>
              </Select>
            </Field>
          </>
        ) : (
          <Field label="Pontuação" htmlFor="ch-score" hint="Ex.: nº de acertos/golos">
            <Input
              id="ch-score"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </Field>
        )}

        <div className={s.actions}>
          <Button onClick={submit} loading={addAttempt.isPending}>
            Registar
          </Button>
        </div>
      </div>
    </Card>
  );
}
