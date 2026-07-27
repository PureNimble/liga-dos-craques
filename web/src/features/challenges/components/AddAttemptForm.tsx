import { useState } from 'react';
import { Alert, Button, Card, Field, Input, Select } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGroupMembers } from '@/features/groups/hooks/groupHooks';
import { useActiveGroupId } from '@/features/groups/hooks/useActiveGroup';
import type { ChallengeResult } from '@/types/database';
import { useAddChallengeAttempt, type Challenge } from '../hooks/challengeHooks';
import panels from './challengePanels.module.css';
import s from './AddAttemptForm.module.css';

/** Manual single-attempt entry form, for challenges that aren't session-based (versus or score-based). */
export function AddAttemptForm({ challenge }: { challenge: Challenge }) {
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
      <h2 className={panels.cardTitle}>{t('challenges.form.title')}</h2>
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
