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
import { useT } from '@/shared/i18n/useT';
import { useAuth } from '@/features/auth/useAuth';
import { useGroupMembers } from '@/features/groups/groupHooks';
import { useActiveGroupId } from '@/features/groups/useActiveGroup';
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
import { spotCount, type CrossbarVariant } from './crossbar/crossbarSpots';
import { PENALTY_ENTRIES } from './penalty/penaltyModes';
import { IconicGoalsEntry } from './iconic/IconicGoalsEntry';
import type { PenaltyMode } from '@/types/database';
import s from './ChallengesPage.module.css';

const CROSSBAR_CODE = 'crossbar';
const PENALTY_CODE = 'penalty';
const ICONIC_CODE = 'iconic_goals';

export function ChallengesPage() {
  const { t } = useT();
  const { data: challenges } = useChallenges();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = challenges?.find((c) => c.id === selectedId) ?? challenges?.[0];

  return (
    <Page>
      <div>
        <PageTitle>{t('challenges.title')}</PageTitle>
        <p className={s.note}>{t('challenges.note')}</p>
      </div>

      {challenges && (
        <PillTabs<number>
          value={selected?.id ?? -1}
          onChange={setSelectedId}
          items={challenges.map((c) => ({
            value: c.id,
            label: c.label,
          }))}
        />
      )}

      {selected &&
        (selected.code === ICONIC_CODE ? (
          <IconicGoalsEntry />
        ) : (
          <ChallengeView challenge={selected} />
        ))}
    </Page>
  );
}

function bestValue(row: ChallengeLeaderboardRow): number | null {
  const isSession = row.challenge_code === CROSSBAR_CODE || row.challenge_code === PENALTY_CODE;
  if (row.scoring_type === 'versus' || isSession) return row.wins;
  if (row.scoring_type === 'lower_better') return row.best_low;
  return row.best_high;
}

function ChallengeView({ challenge }: { challenge: Challenge }) {
  const { t } = useT();
  const isVersus = challenge.scoring_type === 'versus';
  const isCrossbar = challenge.code === CROSSBAR_CODE;
  const isPenalty = challenge.code === PENALTY_CODE;
  // Desafios em sessão ao vivo (Crossbar, Penáltis) e o 1v1 mostram nº de vitórias.
  const isSession = isCrossbar || isPenalty;
  const isWinsBased = isVersus || isSession;
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
    value: isVersus
      ? t('challenges.stats.winsShort', { count: r.wins })
      : isSession
        ? `${r.wins}`
        : `${bestValue(r) ?? '—'}`,
    sub: isVersus
      ? t('challenges.stats.record', { wins: r.wins, losses: r.losses, games: r.attempts })
      : isSession
        ? undefined
        : t('challenges.stats.attempts', { count: r.attempts }),
  }));

  return (
    <div className={s.body}>
      {/* Recorde (não nas sessões ao vivo — o ranking já mostra as vitórias). */}
      {!isSession && (
        <Card className={s.recordCard}>
          <p className={s.recordLabel}>{t('challenges.record.label')}</p>
          {record ? (
            <p className={s.recordValue}>
              {isWinsBased
                ? t('challenges.record.wins', { count: record.wins })
                : `${bestValue(record)}`}{' '}
              <span className={s.recordSub}>· {record.name}</span>
            </p>
          ) : (
            <p className={s.recordEmpty}>{t('challenges.record.empty')}</p>
          )}
        </Card>
      )}

      {isCrossbar ? (
        <CrossbarEntry challenge={challenge} />
      ) : isPenalty ? (
        <PenaltyEntry challenge={challenge} />
      ) : (
        <AddAttemptForm challenge={challenge} />
      )}

      <div>
        <h2 className={s.sectionTitle}>{t('challenges.ranking.title')}</h2>
        <RankingList rows={rankingRows} />
      </div>

      {!isSession && attempts && attempts.length > 0 && (
        <div>
          <h2 className={s.sectionTitle}>{t('challenges.history.title')}</h2>
          <ul className={s.historyList}>
            {attempts.map((a) => (
              <li key={a.id} className={s.historyItem}>
                <span className={s.historyName}>
                  {a.profile?.name ?? t('challenges.history.fallbackName')}
                  {a.opponent?.name ? ` vs ${a.opponent.name}` : ''}
                </span>
                <span className={s.historyMeta}>
                  {isWinsBased ? t(RESULT_KEY[a.result]) : a.score}{' '}
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

const RESULT_KEY: Record<ChallengeResult, string> = {
  win: 'challenges.result.win',
  loss: 'challenges.result.loss',
  draw: 'challenges.result.draw',
  na: 'challenges.result.na',
};

const SESSION_STATUS_KEY: Record<ChallengeSessionStatus, string> = {
  setup: 'challenges.session.status.setup',
  active: 'challenges.session.status.active',
  finished: 'challenges.session.status.finished',
};
const SESSION_STATUS_TONE: Record<ChallengeSessionStatus, BadgeTone> = {
  setup: 'gray',
  active: 'green',
  finished: 'indigo',
};

const CROSSBAR_VARIANT_KEY: Record<CrossbarVariant, string> = {
  quick: 'challenges.crossbar.variant.quick',
  long: 'challenges.crossbar.variant.long',
};

/** Entrada do Crossbar: escolhe a versão (cria no setup) e lista as sessões a decorrer. */
function CrossbarEntry({ challenge }: { challenge: Challenge }) {
  const { t } = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const deleteSession = useDeleteSession(challenge.id);
  const { data: sessions } = useChallengeSessions(challenge.id);

  async function remove(sessionId: string) {
    const ok = await confirm({ title: t('challenges.session.deleteConfirmTitle'), danger: true });
    if (ok) deleteSession.mutate(sessionId);
  }

  return (
    <>
      <Card>
        <h2 className={s.cardTitle}>{t('challenges.crossbar.newSession')}</h2>
        <div className={s.versionGrid}>
          {(['quick', 'long'] as CrossbarVariant[]).map((v) => (
            <button
              key={v}
              className={s.versionCard}
              onClick={() => navigate(`/challenges/crossbar/new?v=${v}`)}
            >
              <span className={s.versionName}>{t(CROSSBAR_VARIANT_KEY[v])}</span>
              <span className={s.versionSpots}>
                {t('challenges.crossbar.spotsCount', { count: spotCount(v) })}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {sessions && sessions.length > 0 && (
        <div>
          <h2 className={s.sectionTitle}>{t('challenges.sessions.ongoing')}</h2>
          <ul className={s.historyList}>
            {sessions.map((sess) => (
              <li key={sess.id} className={s.sessionItem}>
                <button
                  className={s.sessionMain}
                  onClick={() => navigate(`/challenges/crossbar/${sess.id}`)}
                >
                  <Badge tone={SESSION_STATUS_TONE[sess.status]}>
                    {t(SESSION_STATUS_KEY[sess.status])}
                  </Badge>
                  <span className={s.sessionMeta}>
                    {sess.player_count}{' '}
                    {t(
                      sess.player_count === 1
                        ? 'challenges.sessions.player'
                        : 'challenges.sessions.players',
                    )}{' '}
                    · {t('challenges.crossbar.spotsCount', { count: sess.spot_count })} ·{' '}
                    {formatDateShort(sess.created_at)}
                  </span>
                </button>
                {sess.created_by === user?.id && (
                  <IconButton label={t('challenges.session.delete')} onClick={() => remove(sess.id)}>
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

/** Entrada dos Penáltis: escolhe o modo (cria no setup) e lista as sessões a decorrer. */
const PENALTY_ENTRY_KEY: Record<string, { label: string; hint: string }> = {
  goals: { label: 'challenges.penalty.entry.goals.label', hint: 'challenges.penalty.entry.goals.hint' },
  zones: { label: 'challenges.penalty.entry.zones.label', hint: 'challenges.penalty.entry.zones.hint' },
};

const PENALTY_MODE_KEY: Record<PenaltyMode, string> = {
  pen_goals: 'challenges.penalty.mode.pen_goals',
  pen_zones: 'challenges.penalty.mode.pen_zones',
  pen_target: 'challenges.penalty.mode.pen_target',
};

function PenaltyEntry({ challenge }: { challenge: Challenge }) {
  const { t } = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const deleteSession = useDeleteSession(challenge.id);
  const { data: sessions } = useChallengeSessions(challenge.id);

  async function remove(sessionId: string) {
    const ok = await confirm({ title: t('challenges.session.deleteConfirmTitle'), danger: true });
    if (ok) deleteSession.mutate(sessionId);
  }

  return (
    <>
      <Card>
        <h2 className={s.cardTitle}>{t('challenges.penalty.newSession')}</h2>
        <div className={s.versionGrid}>
          {PENALTY_ENTRIES.map((entry) => (
            <button
              key={entry.key}
              className={s.versionCard}
              onClick={() => navigate(`/challenges/penalty/new?m=${entry.key}`)}
            >
              <span className={s.versionName}>{t(PENALTY_ENTRY_KEY[entry.key].label)}</span>
              <span className={s.versionSpots}>{t(PENALTY_ENTRY_KEY[entry.key].hint)}</span>
            </button>
          ))}
        </div>
      </Card>

      {sessions && sessions.length > 0 && (
        <div>
          <h2 className={s.sectionTitle}>{t('challenges.sessions.ongoing')}</h2>
          <ul className={s.historyList}>
            {sessions.map((sess) => (
              <li key={sess.id} className={s.sessionItem}>
                <button
                  className={s.sessionMain}
                  onClick={() => navigate(`/challenges/penalty/${sess.id}`)}
                >
                  <Badge tone={SESSION_STATUS_TONE[sess.status]}>
                    {t(PENALTY_MODE_KEY[sess.mode as PenaltyMode] ?? SESSION_STATUS_KEY[sess.status])}
                  </Badge>
                  <span className={s.sessionMeta}>
                    {sess.player_count}{' '}
                    {t(
                      sess.player_count === 1
                        ? 'challenges.sessions.player'
                        : 'challenges.sessions.players',
                    )}{' '}
                    · {formatDateShort(sess.created_at)}
                  </span>
                </button>
                {sess.created_by === user?.id && (
                  <IconButton label={t('challenges.session.delete')} onClick={() => remove(sess.id)}>
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
  const { t } = useT();
  const { user } = useAuth();
  const groupId = useActiveGroupId();
  const { data: profiles } = useGroupMembers(groupId);
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
      setError(t('challenges.form.error.player'));
      return;
    }
    if (isVersus && !opponentId) {
      setError(t('challenges.form.error.opponent'));
      return;
    }
    if (isVersus && opponentId === playerId) {
      setError(t('challenges.form.error.opponentSame'));
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
      setError(t('challenges.form.error.submit'));
    }
  }

  return (
    <Card>
      <h2 className={s.cardTitle}>{t('challenges.form.title')}</h2>
      {error && (
        <div className={s.slotTop}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className={s.form}>
        <Field label={t('challenges.form.playerLabel')} htmlFor="ch-player">
          <Select id="ch-player" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">{t('challenges.form.choose')}</option>
            {profiles?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        {isVersus ? (
          <>
            <Field label={t('challenges.form.opponentLabel')} htmlFor="ch-opp">
              <Select
                id="ch-opp"
                value={opponentId}
                onChange={(e) => setOpponentId(e.target.value)}
              >
                <option value="">{t('challenges.form.choose')}</option>
                {profiles
                  ?.filter((p) => p.id !== playerId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label={t('challenges.form.resultLabel')} htmlFor="ch-res">
              <Select
                id="ch-res"
                value={result}
                onChange={(e) => setResult(e.target.value as ChallengeResult)}
              >
                <option value="win">{t('challenges.result.win')}</option>
                <option value="loss">{t('challenges.result.loss')}</option>
                <option value="draw">{t('challenges.result.draw')}</option>
              </Select>
            </Field>
          </>
        ) : (
          <Field
            label={t('challenges.form.scoreLabel')}
            htmlFor="ch-score"
            hint={t('challenges.form.scoreHint')}
          >
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
            {t('challenges.form.submit')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
