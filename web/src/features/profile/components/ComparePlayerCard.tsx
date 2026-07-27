import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { useProfilesList } from '../hooks/profileHooks';
import s from './ComparePlayerCard.module.css';

const DATALIST_ID = 'compare-player-options';

/** Search box that looks up a player by name and navigates to their profile. */
export function ComparePlayerCard({ excludeId }: { excludeId?: string }) {
  const { t } = useT();
  const navigate = useNavigate();
  const { data: players } = useProfilesList();
  const [query, setQuery] = useState('');

  const match = players?.find(
    (p) => p.id !== excludeId && p.name.toLowerCase() === query.trim().toLowerCase(),
  );

  return (
    <Card>
      <h2 className={s.title}>{t('profile.compare.title')}</h2>
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (match) navigate(`/players/${match.id}/compare`);
        }}
      >
        <Input
          list={DATALIST_ID}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('profile.compare.placeholder')}
        />
        <datalist id={DATALIST_ID}>
          {players
            ?.filter((p) => p.id !== excludeId)
            .map((p) => <option key={p.id} value={p.name} />)}
        </datalist>
        <Button type="submit" size="sm" variant="secondary" disabled={!match}>
          {t('profile.compare.compare')}
        </Button>
      </form>
    </Card>
  );
}
