import { useNavigate } from 'react-router-dom';
import { Badge, Card, IconButton, type BadgeTone } from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { CloseIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatDateShort } from '@/shared/lib/datetime';
import type { ChallengeSessionStatus, PenaltyMode } from '@/types/database';
import { useChallengeSessions, useDeleteSession, type Challenge } from '../hooks/challengeHooks';
import { PENALTY_ENTRIES } from '../lib/penalty/penaltyModes';
import s from './challengePanels.module.css';

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

const PENALTY_ENTRY_KEY: Record<string, { label: string; hint: string }> = {
  goals: { label: 'challenges.penalty.entry.goals.label', hint: 'challenges.penalty.entry.goals.hint' },
  zones: { label: 'challenges.penalty.entry.zones.label', hint: 'challenges.penalty.entry.zones.hint' },
};

const PENALTY_MODE_KEY: Record<PenaltyMode, string> = {
  pen_goals: 'challenges.penalty.mode.pen_goals',
  pen_zones: 'challenges.penalty.mode.pen_zones',
  pen_target: 'challenges.penalty.mode.pen_target',
};

/** Penalty entry point: pick a mode to start a new session, or resume/delete an ongoing one. */
export function PenaltyEntry({ challenge }: { challenge: Challenge }) {
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
