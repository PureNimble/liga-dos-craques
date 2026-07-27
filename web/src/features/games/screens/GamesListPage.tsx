import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  CardSkeleton,
  EmptyState,
  Modal,
  Page,
  PageTitle,
  SegmentedTabs,
} from '@/shared/components/ui';
import { BallIcon, PlusIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { useGames } from '../hooks/gameHooks';
import { GameCard } from '../components/GameCard';
import { UPCOMING_STATUSES } from '../lib/gameStatus';
import { CreateGameForm } from '../components/CreateGameForm';
import s from './GamesListPage.module.css';

type Tab = 'upcoming' | 'past';

/** Lists upcoming and past games, with quick game creation. */
export function GamesListPage() {
  const { t } = useT();
  const { data: games, isLoading, isError } = useGames();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = (games ?? []).filter((g) =>
    tab === 'upcoming'
      ? UPCOMING_STATUSES.includes(g.status)
      : !UPCOMING_STATUSES.includes(g.status),
  );

  return (
    <Page>
      <div className={s.headerRow}>
        <PageTitle>{t('games.title')}</PageTitle>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon width={18} height={18} />
          {t('games.create')}
        </Button>
      </div>

      <SegmentedTabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { value: 'upcoming', label: t('games.tab.upcoming') },
          { value: 'past', label: t('games.tab.past') },
        ]}
      />

      {isLoading && (
        <div className={s.skeletons}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}
      {isError && <Alert kind="error">{t('games.loadError')}</Alert>}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<BallIcon width={26} height={26} />}
          title={tab === 'upcoming' ? t('games.empty.upcoming.title') : t('games.empty.past.title')}
          description={
            tab === 'upcoming'
              ? t('games.empty.upcoming.description')
              : t('games.empty.past.description')
          }
          action={
            tab === 'upcoming' ? (
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon width={18} height={18} /> {t('games.createFirst')}
              </Button>
            ) : undefined
          }
        />
      )}

      <ul className={s.list}>
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </ul>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('games.createModal.title')}
        description={t('games.createModal.description')}
        variant="sheet"
        size="lg"
      >
        <CreateGameForm
          onSuccess={(id) => {
            setCreateOpen(false);
            navigate(`/games/${id}`);
          }}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </Page>
  );
}
