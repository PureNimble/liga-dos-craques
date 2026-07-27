import { useState } from 'react';
import { Page, PageTitle, PillTabs } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { useChallenges } from '../hooks/challengeHooks';
import { ICONIC_CODE } from '../lib/challengeCodes';
import { IconicGoalsEntry } from '../components/iconic/IconicGoalsEntry';
import { ChallengeView } from '../components/ChallengeView';
import s from './ChallengesPage.module.css';

/** The `/challenges` landing page: challenge tabs, leaderboard, and per-challenge entry point. */
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
