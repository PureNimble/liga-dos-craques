import { useNavigate } from 'react-router-dom';
import { Badge, Card, IconButton, type BadgeTone } from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { CloseIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatDateShort } from '@/shared/lib/datetime';
import type { ChallengeSessionStatus } from '@/types/database';
import { useChallengeSessions, useDeleteSession, type Challenge } from '../hooks/challengeHooks';
import { spotCount, type CrossbarVariant } from '../lib/crossbar/crossbarSpots';
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

const CROSSBAR_VARIANT_KEY: Record<CrossbarVariant, string> = {
  quick: 'challenges.crossbar.variant.quick',
  long: 'challenges.crossbar.variant.long',
};

/** Crossbar entry point: pick a variant to start a new session, or resume/delete an ongoing one. */
export function CrossbarEntry({ challenge }: { challenge: Challenge }) {
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
