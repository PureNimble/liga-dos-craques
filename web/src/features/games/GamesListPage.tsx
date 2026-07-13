import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, CardSkeleton, EmptyState, Modal, SegmentedTabs } from '@/components/ui';
import { BallIcon, CalendarIcon, PinIcon, PlusIcon, ChevronRightIcon } from '@/components/ui/icons';
import { formatGameDateTime } from '@/lib/datetime';
import { useGames, type GameWithFormat } from './gameHooks';
import { StatusBadge } from './StatusBadge';
import { UPCOMING_STATUSES } from './gameStatus';
import { CreateGameForm } from './CreateGameForm';

type Tab = 'upcoming' | 'past';

export function GamesListPage() {
  const { data: games, isLoading, isError } = useGames();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = (games ?? []).filter((g) =>
    tab === 'upcoming' ? UPCOMING_STATUSES.includes(g.status) : !UPCOMING_STATUSES.includes(g.status),
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tightest text-white sm:text-3xl">Jogos</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <PlusIcon width={18} height={18} />
          Criar jogo
        </Button>
      </div>

      <SegmentedTabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { value: 'upcoming', label: 'Próximos' },
          { value: 'past', label: 'Anteriores' },
        ]}
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}
      {isError && <Alert kind="error">Não foi possível carregar os jogos.</Alert>}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<BallIcon width={26} height={26} />}
          title={tab === 'upcoming' ? 'Sem jogos por jogar' : 'Ainda não há jogos passados'}
          description={
            tab === 'upcoming' ? 'Marca o próximo jogo e convoca a malta.' : 'Os jogos concluídos aparecem aqui.'
          }
          action={
            tab === 'upcoming' ? (
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon width={18} height={18} /> Criar o primeiro
              </Button>
            ) : undefined
          }
        />
      )}

      <ul className="flex flex-col gap-3">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </ul>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Criar jogo"
        description="Marca a data, o formato e convoca a malta."
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
    </div>
  );
}

function GameCard({ game }: { game: GameWithFormat }) {
  const hasScore = game.team_a_score !== null || game.team_b_score !== null;
  return (
    <li>
      <Link to={`/games/${game.id}`}>
        <Card interactive className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pitch-500/10 text-pitch-300 ring-1 ring-pitch-500/15">
            <BallIcon width={22} height={22} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold capitalize text-slate-100">
                {formatGameDateTime(game.scheduled_at)}
              </p>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-slate-400">
              <CalendarIcon width={13} height={13} />
              {game.game_format?.label ?? '—'}
              {game.location && (
                <>
                  <PinIcon width={13} height={13} className="ml-1" />
                  <span className="truncate">{game.location}</span>
                </>
              )}
            </p>
            {hasScore && (
              <p className="mt-1.5 text-sm font-bold tabular-nums text-slate-100">
                {game.team_a_score ?? 0} <span className="text-slate-500">–</span>{' '}
                {game.team_b_score ?? 0}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={game.status} />
            <ChevronRightIcon width={16} height={16} className="text-slate-600" />
          </div>
        </Card>
      </Link>
    </li>
  );
}
