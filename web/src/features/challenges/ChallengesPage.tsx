import { useMemo, useState } from 'react';
import { Alert, Button, Card, Field, Input, PillTabs, Select } from '@/shared/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { useProfilesList } from '@/features/profile/profileHooks';
import { RankingList, type RankingRow } from '@/features/rankings/RankingList';
import { formatDate } from '@/shared/lib/datetime';
import type { ChallengeResult } from '@/types/database';
import {
  useAddChallengeAttempt,
  useChallengeAttempts,
  useChallengeLeaderboard,
  useChallenges,
  type Challenge,
  type ChallengeLeaderboardRow,
} from './challengeHooks';

export function ChallengesPage() {
  const { data: challenges } = useChallenges();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = challenges?.find((c) => c.id === selectedId) ?? challenges?.[0];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tightest text-white sm:text-3xl">Desafios</h1>
        <p className="mt-1 text-xs text-slate-500">
          Área separada — não conta para as estatísticas dos jogos.
        </p>
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
    </div>
  );
}

function bestValue(row: ChallengeLeaderboardRow): number | null {
  if (row.scoring_type === 'versus') return row.wins;
  if (row.scoring_type === 'lower_better') return row.best_low;
  return row.best_high;
}

function ChallengeView({ challenge }: { challenge: Challenge }) {
  const isVersus = challenge.scoring_type === 'versus';
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
    value: isVersus ? `${r.wins}V` : `${bestValue(r) ?? '—'}`,
    sub: isVersus ? `${r.wins}V-${r.losses}D · ${r.attempts} jogos` : `${r.attempts} tentativas`,
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Recorde */}
      <Card className="bg-gradient-to-br from-navy-850 to-navy-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recorde</p>
        {record ? (
          <p className="mt-1 text-lg font-bold text-slate-100">
            {isVersus ? `${record.wins} vitórias` : `${bestValue(record)}`}{' '}
            <span className="text-sm font-normal text-slate-400">· {record.name}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">Ainda sem registos.</p>
        )}
      </Card>

      <AddAttemptForm challenge={challenge} />

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Ranking</h2>
        <RankingList rows={rankingRows} />
      </div>

      {attempts && attempts.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Histórico recente
          </h2>
          <ul className="flex flex-col divide-y divide-navy-800 rounded-2xl border border-navy-800 bg-navy-900 shadow-card">
            {attempts.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-slate-200">
                  {a.profile?.name ?? 'Jogador'}
                  {a.opponent?.name ? ` vs ${a.opponent.name}` : ''}
                </span>
                <span className="text-slate-400">
                  {isVersus ? resultLabel(a.result) : a.score}{' '}
                  <span className="text-slate-600">· {formatDate(a.played_at)}</span>
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
      <h2 className="mb-3 font-bold text-slate-100">Registar tentativa</h2>
      {error && (
        <div className="mb-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-3">
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

        <div className="flex justify-end">
          <Button onClick={submit} loading={addAttempt.isPending}>
            Registar
          </Button>
        </div>
      </div>
    </Card>
  );
}
