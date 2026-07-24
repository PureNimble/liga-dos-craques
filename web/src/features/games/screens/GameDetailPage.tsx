import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Loading, Modal, Page } from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { ChevronLeftIcon, WhistleIcon } from '@/shared/components/ui/icons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/profile/hooks/profileHooks';
import { useT } from '@/shared/i18n/useT';
import {
  pickFormatForCount,
  useGame,
  useGameFormats,
  useGamePlayers,
  useUpdateGame,
  useUpdateGameStatus,
} from '../hooks/gameHooks';
import { useGameRealtime } from '../hooks/useGameRealtime';
import { useMatchClock } from '../hooks/useMatchClock';
import { MatchHeader } from '../components/MatchHeader';
import { PlayerRoster } from '../components/PlayerRoster';
import { ALLOWED_TRANSITIONS, GAME_STATUS_KEY, GAME_TRANSITION_KEY } from '../lib/gameStatus';
import { CreateGameForm } from '../components/CreateGameForm';
import { EventTimeline } from '@/features/events/components/EventTimeline';
import { EventSoundboard } from '@/features/events/components/EventSoundboard';
import { AwardsPanel } from '@/features/awards/components/AwardsPanel';
import { useResolveAwards } from '@/features/awards/hooks/awardHooks';
import { TeamsPanel } from '@/features/teams/components/TeamsPanel';
import { usePlayerRatings, useAssignTeams } from '@/features/teams/hooks/teamHooks';
import { balanceTeams } from '@/features/teams/lib/teamBalancer';
import type { GameStatus } from '@/types/database';
import s from './GameDetailPage.module.css';

const TEAMS_GENERATABLE: GameStatus[] = ['scheduled', 'open', 'teams_generated'];

// O plantel fecha quando o jogo arranca — depois não se convida nem remove ninguém.
const ROSTER_EDITABLE: GameStatus[] = ['draft', 'scheduled', 'open', 'teams_generated'];
// A composição das equipas (gerar / mover entre A e B) só é possível ANTES do arranque.
const TEAMS_EDITABLE: GameStatus[] = ['draft', 'scheduled', 'open', 'teams_generated'];
// Detalhes do jogo (data, local, formato, notas) só editáveis ANTES do arranque.
const DETAILS_EDITABLE: GameStatus[] = ['draft', 'scheduled', 'open', 'teams_generated'];
// Estados em que já faz sentido ter eventos (jogo começou).
const EVENTS_VISIBLE: GameStatus[] = ['in_progress', 'finished', 'voting_open', 'closed'];
const EVENTS_EDITABLE: GameStatus[] = ['in_progress', 'finished'];

export function GameDetailPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: game, isLoading, isError } = useGame(id);
  const { data: players } = useGamePlayers(id);
  const updateStatus = useUpdateGameStatus(id as string);
  const updateGame = useUpdateGame(id as string);
  const assignTeams = useAssignTeams(id as string);
  const { data: formats } = useGameFormats();
  const rosterIds = (players ?? []).map((p) => p.player_id);
  const { data: ratings } = usePlayerRatings(rosterIds);
  const resolveAwards = useResolveAwards(id as string);
  const confirm = useConfirm();
  useGameRealtime(id);

  const clock = useMatchClock(game?.started_at, game?.status === 'in_progress');

  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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
  // Decidir equipas (gerar/mover) só antes do arranque; substituir só com o jogo a decorrer.
  const teamsEditable = isOrganizer && TEAMS_EDITABLE.includes(game.status);
  const canSubstitute = isOrganizer && game.status === 'in_progress';
  // Eventos editáveis ao vivo e na revisão (finished); depois do apuramento ficam fechados.
  const eventsEditable = isOrganizer && EVENTS_EDITABLE.includes(game.status);
  const transitions = ALLOWED_TRANSITIONS[game.status];
  const roster = players ?? [];
  const canGenerateTeams = TEAMS_GENERATABLE.includes(game.status);
  const hasTeams = roster.some((p) => p.team);
  const showTeams = hasTeams || (isOrganizer && canGenerateTeams && roster.length >= 2);

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
    // Ao arrancar o jogo, marca o início do cronómetro (uma única vez).
    const startedAt =
      status === 'in_progress' && !game?.started_at ? { started_at: new Date().toISOString() } : {};
    await updateStatus.mutateAsync({ status, ...startedAt });
    setManageOpen(false);
  }

  async function finishGame() {
    // O placar já reflete os eventos; terminar apenas fixa o resultado.
    await updateStatus.mutateAsync({ status: 'finished' });
    setManageOpen(false);
  }

  // Apura MVP/Flop pelo rating: fecha o jogo se forem automáticos, ou abre a
  // votação de desempate quando há empate no topo/fundo.
  async function resolveGameAwards() {
    await resolveAwards.mutateAsync();
    setManageOpen(false);
  }

  // Encerra inscrições e forma equipas. O formato escolhido é o MÁXIMO por lado
  // (a capacidade do campo): com MENOS inscritos, desce para um formato inferior;
  // com MAIS, mantém-se e os excedentes ficam suplentes.
  async function closeRegistrations() {
    if (!formats || !game) return;
    const count = roster.length;
    const maxPerSide = game.game_format?.players_per_side ?? Math.ceil(game.max_players / 2);
    // Só formatos até ao teto escolhido — nunca sobe acima do formato do campo.
    const eligible = formats.filter((f) => f.players_per_side <= maxPerSide);
    const fmt = pickFormatForCount(count, eligible);
    if (!fmt) return;
    const changed = fmt.id !== game.format_id;
    const ok = await confirm({
      title: t('games.detail.closeRegistrationsTitle'),
      message: changed
        ? t('games.detail.closeRegistrationsChanged', { count, format: fmt.label })
        : t('games.detail.closeRegistrationsSame', { count, format: fmt.label }),
      confirmLabel: t('games.detail.closeRegistrationsConfirm'),
    });
    if (!ok) return;
    if (changed) {
      await updateGame.mutateAsync({
        scheduled_at: game.scheduled_at,
        location: game.location,
        place_id: game.place_id,
        format_id: fmt.id,
        max_players: fmt.players_per_side * 2,
        notes: game.notes,
      });
    }
    const { a, b } = balanceTeams(
      roster.map((p) => ({
        id: p.player_id,
        rating: ratings?.get(p.player_id)?.rating ?? 50,
        category: ratings?.get(p.player_id)?.category ?? null,
      })),
    );
    await assignTeams.mutateAsync({ a, b });
    setManageOpen(false);
  }

  const noManageActions =
    transitions.length === 0 && game.status !== 'in_progress' && game.status !== 'finished';

  // Coluna das equipas/campo (esquerda no desktop) e coluna de informação
  // (eventos, MVP/Flop, plantel — direita no desktop). No telemóvel empilham.
  const teamsSection = showTeams && (
    <TeamsPanel
      gameId={game.id}
      players={roster}
      canManage={teamsEditable}
      canSubstitute={canSubstitute}
      canGenerate={canGenerateTeams}
      playersPerSide={game.game_format?.players_per_side ?? Math.ceil(game.max_players / 2)}
      currentMinute={clock.minute}
    />
  );

  const infoSection = (
    <>
      {/* Eventos (golos, assistências, defesas, …) */}
      {EVENTS_VISIBLE.includes(game.status) && (
        <Card>
          <h2 className={s.sectionHead}>{t('games.detail.events')}</h2>
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
      )}

      {/* MVP / Flop — só depois de apurar (fechado); nunca durante a revisão */}
      {(game.status === 'voting_open' || game.status === 'closed') && (
        <AwardsPanel gameId={game.id} players={players ?? []} />
      )}

      {/* Plantel */}
      <PlayerRoster
        gameId={game.id}
        groupId={game.group_id}
        players={players ?? []}
        maxPlayers={game.max_players}
        canManage={isOrganizer}
        currentUserId={user!.id}
        editable={rosterEditable}
      />
    </>
  );

  return (
    <Page>
      <Link to="/games" className={s.back}>
        <ChevronLeftIcon width={16} height={16} /> {t('games.detail.back')}
      </Link>

      {/* Cabeçalho / placar em destaque (estilo transmissão) */}
      <MatchHeader game={game} clock={clock} />

      {game.notes && <Card className={s.notes}>{game.notes}</Card>}

      {isOrganizer && (
        <Button variant="secondary" block onClick={() => setManageOpen(true)}>
          <WhistleIcon width={18} height={18} /> {t('games.detail.manageGame')}
        </Button>
      )}

      {/* Equipas à esquerda e informação à direita no desktop; empilham no telemóvel */}
      {showTeams ? (
        <div className={s.grid}>
          {/* .col tem min-width:0 — sem isso os filhos da grelha assumem
              min-width:auto e recusam encolher (ex.: o <select> de convidar
              pelo nome mais longo), empurrando a coluna para lá do ecrã. */}
          <div className={s.col}>{teamsSection}</div>
          <div className={s.col}>{infoSection}</div>
        </div>
      ) : (
        infoSection
      )}

      {/* Painel de gestão (organizador) — em modal / bottom sheet */}
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

          {(game.status === 'scheduled' || game.status === 'open') && (
            <Button
              block
              onClick={closeRegistrations}
              loading={updateGame.isPending || assignTeams.isPending}
            >
              {t('games.detail.closeRegistrationsAndForm')}
            </Button>
          )}

          {/* Terminar (o placar segue os eventos registados) */}
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

          {/* Apurar MVP/Flop (após terminar) — automático ou abre desempate */}
          {game.status === 'finished' && (
            <Button block onClick={resolveGameAwards} loading={resolveAwards.isPending}>
              {t('games.detail.resolveAwards')}
            </Button>
          )}

          {/* Outras transições */}
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

      {/* Editar detalhes do jogo */}
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
