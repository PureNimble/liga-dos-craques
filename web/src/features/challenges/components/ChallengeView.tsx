import { useMemo } from 'react';
import { Card } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { RankingList, type RankingRow } from '@/features/rankings/components/RankingList';
import { formatDate } from '@/shared/lib/datetime';
import type { ChallengeResult } from '@/types/database';
import {
  useChallengeAttempts,
  useChallengeLeaderboard,
  type Challenge,
  type ChallengeLeaderboardRow,
} from '../hooks/challengeHooks';
import { CROSSBAR_CODE, PENALTY_CODE } from '../lib/challengeCodes';
import { CrossbarEntry } from './CrossbarEntry';
import { PenaltyEntry } from './PenaltyEntry';
import { AddAttemptForm } from './AddAttemptForm';
import panels from './challengePanels.module.css';
import s from './ChallengeView.module.css';

const RESULT_KEY: Record<ChallengeResult, string> = {
  win: 'challenges.result.win',
  loss: 'challenges.result.loss',
  draw: 'challenges.result.draw',
  na: 'challenges.result.na',
};

function bestValue(row: ChallengeLeaderboardRow): number | null {
  const isSession = row.challenge_code === CROSSBAR_CODE || row.challenge_code === PENALTY_CODE;
  if (row.scoring_type === 'versus' || isSession) return row.wins;
  if (row.scoring_type === 'lower_better') return row.best_low;
  return row.best_high;
}

/** One challenge's tab body: personal record, entry point (session-based or single-attempt form), ranking, history. */
export function ChallengeView({ challenge }: { challenge: Challenge }) {
  const { t } = useT();
  const isVersus = challenge.scoring_type === 'versus';
  const isCrossbar = challenge.code === CROSSBAR_CODE;
  const isPenalty = challenge.code === PENALTY_CODE;
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
        : `${bestValue(r) ?? '-'}`,
    sub: isVersus
      ? t('challenges.stats.record', { wins: r.wins, losses: r.losses, games: r.attempts })
      : isSession
        ? undefined
        : t('challenges.stats.attempts', { count: r.attempts }),
  }));

  return (
    <div className={s.body}>
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
        <h2 className={panels.sectionTitle}>{t('challenges.ranking.title')}</h2>
        <RankingList rows={rankingRows} />
      </div>

      {!isSession && attempts && attempts.length > 0 && (
        <div>
          <h2 className={panels.sectionTitle}>{t('challenges.history.title')}</h2>
          <ul className={panels.historyList}>
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
