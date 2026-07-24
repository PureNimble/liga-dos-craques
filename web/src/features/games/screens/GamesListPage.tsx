import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardSkeleton,
  EmptyState,
  Modal,
  Page,
  PageTitle,
  SegmentedTabs,
} from '@/shared/components/ui';
import {
  BallIcon,
  CalendarIcon,
  PinIcon,
  PlusIcon,
  ChevronRightIcon,
} from '@/shared/components/ui/icons';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { useT } from '@/shared/i18n/useT';
import { useGames, type GameWithFormat } from '../hooks/gameHooks';
import { StatusBadge } from '../components/StatusBadge';
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

function GameCard({ game }: { game: GameWithFormat }) {
  const hasScore = game.team_a_score !== null || game.team_b_score !== null;
  return (
    <li className={s.item}>
      <Link to={`/games/${game.id}`} className={s.cardLink}>
        <Card interactive className={s.card}>
          <span className={s.icon}>
            <BallIcon width={22} height={22} />
          </span>

          <div className={s.info}>
            <p className={s.date}>{formatGameDateTime(game.scheduled_at)}</p>
            <p className={s.meta}>
              <CalendarIcon width={13} height={13} />
              {game.game_format?.label ?? '—'}
              {game.location && (
                <>
                  <PinIcon width={13} height={13} className={s.metaLoc} />
                  <span className={s.locText}>{game.location}</span>
                </>
              )}
            </p>
            {hasScore && (
              <p className={s.score}>
                {game.team_a_score ?? 0} <span className={s.scoreDash}>–</span>{' '}
                {game.team_b_score ?? 0}
              </p>
            )}
          </div>

          <div className={s.side}>
            <StatusBadge status={game.status} />
            <ChevronRightIcon width={16} height={16} className={s.chevron} />
          </div>
        </Card>
      </Link>
    </li>
  );
}
