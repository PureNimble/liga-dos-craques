import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Avatar, Button, Card, Loading, Modal, Page, SegmentedTabs } from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { ChevronLeftIcon, MailIcon } from '@/shared/components/ui/icons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/profileHooks';
import { useT } from '@/shared/i18n/useT';
import { useGame, useGamePlayers, useUpdateGameStatus } from '../hooks/gameHooks';
import { useGameRealtime } from '../hooks/useGameRealtime';
import { useMatchClock } from '../hooks/useMatchClock';
import { MatchHeader } from '../components/MatchHeader';
import { GameDetailsCard } from '../components/GameDetailsCard';
import { PlayerRoster } from '../components/PlayerRoster';
import { RosterPreviewColumn } from '../components/RosterPreviewColumn';
import { ALLOWED_TRANSITIONS, GAME_STATUS_KEY, GAME_TRANSITION_KEY } from '../lib/gameStatus';
import { CreateGameForm } from '../components/CreateGameForm';
import { EventTimeline } from '@/features/events/components/EventTimeline';
import { EventSoundboard } from '@/features/events/components/EventSoundboard';
import { AwardsPanel } from '@/features/awards/components/AwardsPanel';
import { useResolveAwards } from '@/features/awards/hooks/awardHooks';
import { TeamsPanel } from '@/features/teams/components/TeamsPanel';
import { EquipmentCard } from '@/features/teams/components/EquipmentCard';
import { useGameTeams } from '@/features/teams/hooks/teamHooks';
import type { GameStatus } from '@/types/database';
import s from './GameDetailPage.module.css';

const TEAMS_GENERATABLE: GameStatus[] = ['scheduled', 'open', 'teams_generated'];
const PENDING_PREVIEW_MAX = 4;

const ROSTER_EDITABLE: GameStatus[] = ['draft', 'scheduled', 'open', 'teams_generated'];
const TEAMS_EDITABLE: GameStatus[] = ['draft', 'scheduled', 'open', 'teams_generated'];
const DETAILS_EDITABLE: GameStatus[] = ['draft', 'scheduled', 'open', 'teams_generated'];
const EVENTS_VISIBLE: GameStatus[] = ['in_progress', 'finished', 'voting_open', 'closed'];
const EVENTS_EDITABLE: GameStatus[] = ['in_progress', 'finished'];
const STATS_VISIBLE: GameStatus[] = ['voting_open', 'closed'];

type Tab = 'geral' | 'planteis' | 'eventos' | 'convites' | 'estatisticas' | 'resumo';
const TABS: Tab[] = ['geral', 'planteis', 'eventos', 'convites', 'estatisticas', 'resumo'];

/** Screen for a single game: header/score, tabs (details/teams/events/invites/stats/summary), and organizer actions. */
export function GameDetailPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: game, isLoading, isError } = useGame(id);
  const { data: players } = useGamePlayers(id);
  const updateStatus = useUpdateGameStatus(id as string);
  const { data: gameTeams } = useGameTeams(id);
  const resolveAwards = useResolveAwards(id as string);
  const confirm = useConfirm();
  useGameRealtime(id);

  const clock = useMatchClock(game?.started_at, game?.status === 'in_progress');

  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('geral');

  if (isLoading) return <Loading />;
  if (isError || !game) {
    return (
      <div className={s.errorPage}>
        <Alert kind="error">{t('games.detail.notFound')}</Alert>
        <Link to="/games" className={s.errorBack}>
          {t('games.detail.backToGames')}
        </Link>
      </div>
    );
  }

  const isOrganizer = game.created_by === user?.id || profile?.role === 'admin';
  const rosterEditable = ROSTER_EDITABLE.includes(game.status);
  const teamsEditable = isOrganizer && TEAMS_EDITABLE.includes(game.status);
  const canSubstitute = isOrganizer && game.status === 'in_progress';
  const eventsEditable = isOrganizer && EVENTS_EDITABLE.includes(game.status);
  const transitions = ALLOWED_TRANSITIONS[game.status];
  const roster = players ?? [];
  const canGenerateTeams = TEAMS_GENERATABLE.includes(game.status);
  const confirmedPlayers = roster.filter((p) => p.status === 'confirmed' || p.status === 'played');
  const pendingPlayers = roster.filter((p) => p.status === 'invited');
  const confirmedCount = confirmedPlayers.length;
  const confirmedPct = Math.max(0, Math.min(100, Math.round((confirmedCount / game.max_players) * 100)));
  const confirmedTeamA = confirmedPlayers.filter((p) => p.team === 'A');
  const confirmedTeamB = confirmedPlayers.filter((p) => p.team === 'B');
  const rostersSplit = confirmedTeamA.length > 0 || confirmedTeamB.length > 0;
  const pendingOverflow = pendingPlayers.length > PENDING_PREVIEW_MAX;
  const visiblePending = pendingOverflow
    ? pendingPlayers.slice(0, PENDING_PREVIEW_MAX - 1)
    : pendingPlayers;
  const morePendingCount = pendingPlayers.length - visiblePending.length;

  async function changeStatus(status: GameStatus) {
    if (
      status === 'cancelled' &&
      !(await confirm({
        title: t('games.detail.cancelTitle'),
        message: t('games.detail.cancelMessage'),
        confirmLabel: t('games.detail.cancelConfirm'),
        danger: true,
      }))
    )
      return;
    if (
      status === 'closed' &&
      !(await confirm({
        title: t('games.detail.closeTitle'),
        message: t('games.detail.closeMessage'),
        confirmLabel: t('games.detail.closeConfirm'),
      }))
    )
      return;
    const startedAt =
      status === 'in_progress' && !game?.started_at ? { started_at: new Date().toISOString() } : {};
    await updateStatus.mutateAsync({ status, ...startedAt });
    setManageOpen(false);
  }

  async function finishGame() {
    await updateStatus.mutateAsync({ status: 'finished' });
    setManageOpen(false);
  }

  async function resolveGameAwards() {
    await resolveAwards.mutateAsync();
    setManageOpen(false);
  }

  const noManageActions =
    transitions.length === 0 && game.status !== 'in_progress' && game.status !== 'finished';

  return (
    <Page>
      <Link to="/games" className={s.back}>
        <ChevronLeftIcon width={16} height={16} /> {t('games.detail.back')}
      </Link>

      <MatchHeader
        game={game}
        clock={clock}
        confirmedCount={confirmedCount}
        maxPlayers={game.max_players}
        isOrganizer={isOrganizer}
        onManage={() => setManageOpen(true)}
      />

      <div className={s.tabsWrap}>
        <SegmentedTabs<Tab>
          value={tab}
          onChange={setTab}
          items={TABS.map((value) => ({ value, label: t(`games.detail.tab.${value}`) }))}
        />
      </div>

      {tab === 'geral' && (
        <>
          <div className={s.geralGrid}>
            <div className={s.geralCol}>
              <GameDetailsCard game={game} />

              <Card>
                <div className={s.confirmHead}>
                  <h2 className={s.sectionHead}>{t('games.detail.confirmations')}</h2>
                  <span className={s.confirmCount}>
                    {confirmedCount} / {game.max_players}
                  </span>
                </div>
                <div className={s.confirmTrack}>
                  <div className={s.confirmFill} style={{ width: `${confirmedPct}%` }} />
                </div>
                {confirmedPlayers.length > 0 && (
                  <div className={s.confirmAvatars}>
                    {confirmedPlayers.slice(0, 8).map((p) => (
                      <Avatar
                        key={p.id}
                        name={p.profile?.name}
                        src={p.profile?.photo_url}
                        size="sm"
                        className={s.confirmAvatar}
                      />
                    ))}
                    {confirmedPlayers.length > 8 && (
                      <span className={s.confirmAvatarOverflow}>
                        +{confirmedPlayers.length - 8}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <div className={s.geralCol}>
              {confirmedPlayers.length > 0 && (
                <Card>
                  <h2 className={s.sectionHead}>{t('games.detail.tab.planteis')}</h2>
                  {rostersSplit ? (
                    <div className={s.rosterPreviewGrid}>
                      <RosterPreviewColumn
                        name={gameTeams?.A?.name || t('teams.team', { team: 'A' })}
                        players={confirmedTeamA}
                      />
                      <RosterPreviewColumn
                        name={gameTeams?.B?.name || t('teams.team', { team: 'B' })}
                        players={confirmedTeamB}
                      />
                    </div>
                  ) : (
                    <RosterPreviewColumn
                      name={t('games.detail.confirmations')}
                      players={confirmedPlayers}
                    />
                  )}
                </Card>
              )}

              {pendingPlayers.length > 0 && (
                <Card>
                  <h2 className={s.sectionHead}>{t('games.detail.pendingTitle')}</h2>
                  <ul className={s.pendingList}>
                    {visiblePending.map((p) => (
                      <li key={p.id} className={s.pendingRow}>
                        <MailIcon width={18} height={18} className={s.pendingIcon} />
                        <div className={s.pendingInfo}>
                          <span className={s.pendingTag}>{t('games.detail.pendingTag')}</span>
                          <span className={s.pendingName}>
                            {p.profile?.name ?? t('games.roster.fallbackName')}
                          </span>
                        </div>
                      </li>
                    ))}
                    {pendingOverflow && (
                      <li className={`${s.pendingRow} ${s.pendingMore}`}>
                        {t('games.detail.morePending', { count: morePendingCount })}
                      </li>
                    )}
                  </ul>
                </Card>
              )}
            </div>
          </div>

          {isOrganizer && (
            <div className={s.geralActions}>
              {transitions.includes('cancelled') && (
                <Button
                  variant="danger"
                  block
                  onClick={() => changeStatus('cancelled')}
                  loading={updateStatus.isPending}
                >
                  {t('games.transition.cancelled')}
                </Button>
              )}
              {transitions.includes('in_progress') && (
                <Button block onClick={() => changeStatus('in_progress')} loading={updateStatus.isPending}>
                  {t('games.transition.in_progress')}
                </Button>
              )}
              <Button variant="secondary" block onClick={() => setTab('convites')}>
                {t('games.detail.openInvites')}
              </Button>
            </div>
          )}
        </>
      )}

      {tab === 'planteis' && (
        <div className={s.tabPane}>
          {roster.length > 0 ? (
            <div className={s.planteisGrid}>
              <TeamsPanel
                gameId={game.id}
                players={roster}
                canManage={teamsEditable}
                canSubstitute={canSubstitute}
                canGenerate={canGenerateTeams}
                playersPerSide={game.game_format?.players_per_side ?? Math.ceil(game.max_players / 2)}
                currentMinute={clock.minute}
              />
              <div className={s.geralCol}>
                <GameDetailsCard game={game} />
                <EquipmentCard gameId={game.id} />
              </div>
            </div>
          ) : (
            <p className={s.emptyNote}>{t('games.detail.noPlayersYet')}</p>
          )}
        </div>
      )}

      {tab === 'eventos' && (
        <div className={s.tabPane}>
          {EVENTS_VISIBLE.includes(game.status) ? (
            <Card>
              {game.status === 'finished' && isOrganizer && (
                <div className={s.infoSlot}>
                  <Alert kind="info">{t('games.detail.reviewNotice')}</Alert>
                </div>
              )}
              {(game.status === 'voting_open' || game.status === 'closed') && (
                <p className={s.closedNote}>{t('games.detail.eventsClosed')}</p>
              )}
              {eventsEditable && (
                <div className={s.soundboardWrap}>
                  <EventSoundboard gameId={game.id} players={roster} currentMinute={clock.minute} />
                </div>
              )}
              <EventTimeline gameId={game.id} canManage={eventsEditable} />
            </Card>
          ) : (
            <p className={s.emptyNote}>{t('games.detail.noEventsYet')}</p>
          )}
        </div>
      )}

      {tab === 'convites' && (
        <div className={s.tabPane}>
          <PlayerRoster
            gameId={game.id}
            groupId={game.group_id}
            players={players ?? []}
            maxPlayers={game.max_players}
            canManage={isOrganizer}
            currentUserId={user!.id}
            editable={rosterEditable}
          />
        </div>
      )}

      {tab === 'estatisticas' && (
        <div className={s.tabPane}>
          {STATS_VISIBLE.includes(game.status) ? (
            <AwardsPanel gameId={game.id} players={players ?? []} />
          ) : (
            <p className={s.emptyNote}>{t('games.detail.noStatsYet')}</p>
          )}
        </div>
      )}

      {tab === 'resumo' && (
        <div className={s.tabPane}>
          {game.status === 'closed' ? (
            <AwardsPanel gameId={game.id} players={players ?? []} />
          ) : (
            <p className={s.emptyNote}>{t('games.detail.noSummaryYet')}</p>
          )}
        </div>
      )}

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title={t('games.detail.manageTitle')}
        description={t(GAME_STATUS_KEY[game.status])}
        variant="sheet"
      >
        <div className={s.modalBody}>
          {updateStatus.isError && <Alert kind="error">{t('games.detail.updateError')}</Alert>}

          {DETAILS_EDITABLE.includes(game.status) ? (
            <Button
              variant="secondary"
              block
              onClick={() => {
                setManageOpen(false);
                setEditOpen(true);
              }}
            >
              {t('games.detail.editDetails')}
            </Button>
          ) : (
            <p className={s.lockedNote}>{t('games.detail.lockedNote')}</p>
          )}

          {game.status === 'in_progress' && (
            <div className={s.resultBox}>
              <p className={s.resultLabel}>{t('games.detail.currentResult')}</p>
              <p className={s.resultScore}>
                {game.team_a_score ?? 0} <span className={s.resultDash}>–</span>{' '}
                {game.team_b_score ?? 0}
              </p>
              <Button block onClick={finishGame} loading={updateStatus.isPending}>
                {t('games.detail.finishGame')}
              </Button>
            </div>
          )}

          {game.status === 'finished' && (
            <Button block onClick={resolveGameAwards} loading={resolveAwards.isPending}>
              {t('games.detail.resolveAwards')}
            </Button>
          )}

          {transitions.filter((tr) => tr !== 'finished').length > 0 && (
            <div className={s.btnGroup}>
              {transitions
                .filter((tr) => tr !== 'finished')
                .map((tr) => (
                  <Button
                    key={tr}
                    block
                    variant={
                      tr === 'cancelled' ? 'danger' : tr === 'closed' ? 'secondary' : 'primary'
                    }
                    onClick={() => changeStatus(tr)}
                    loading={updateStatus.isPending}
                  >
                    {t(GAME_TRANSITION_KEY[tr] ?? GAME_STATUS_KEY[tr])}
                  </Button>
                ))}
            </div>
          )}

          {noManageActions && <p className={s.emptyNote}>{t('games.detail.noActions')}</p>}
        </div>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('games.detail.editTitle')}
        variant="sheet"
        size="lg"
      >
        <CreateGameForm
          game={game}
          onSuccess={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>
    </Page>
  );
}
