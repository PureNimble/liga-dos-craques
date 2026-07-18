import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Loading, Modal, Page } from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { ChevronLeftIcon, WhistleIcon } from '@/shared/components/ui/icons';
import { useAuth } from '@/features/auth/useAuth';
import { useProfile } from '@/features/profile/profileHooks';
import {
  pickFormatForCount,
  useGame,
  useGameFormats,
  useGamePlayers,
  useUpdateGame,
  useUpdateGameStatus,
} from './gameHooks';
import { useGameRealtime } from './useGameRealtime';
import { useMatchClock } from './useMatchClock';
import { MatchHeader } from './MatchHeader';
import { PlayerRoster } from './PlayerRoster';
import { ALLOWED_TRANSITIONS, GAME_STATUS_LABELS, GAME_TRANSITION_LABELS } from './gameStatus';
import { CreateGameForm } from './CreateGameForm';
import { EventTimeline } from '@/features/events/EventTimeline';
import { EventSoundboard } from '@/features/events/EventSoundboard';
import { AwardsPanel } from '@/features/awards/AwardsPanel';
import { useResolveAwards } from '@/features/awards/awardHooks';
import { TeamsPanel } from '@/features/teams/TeamsPanel';
import { usePlayerRatings, useAssignTeams } from '@/features/teams/teamHooks';
import { balanceTeams } from '@/features/teams/teamBalancer';
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
        <Alert kind="error">Jogo não encontrado.</Alert>
        <Link to="/games" className={s.errorBack}>
          ← Voltar aos jogos
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
        title: 'Cancelar este jogo?',
        message: 'Os jogadores convocados serão notificados. Esta ação não pode ser revertida.',
        confirmLabel: 'Cancelar jogo',
        danger: true,
      }))
    )
      return;
    if (
      status === 'closed' &&
      !(await confirm({
        title: 'Fechar o jogo?',
        message: 'O jogo será fechado e o XP atribuído. Esta ação é definitiva.',
        confirmLabel: 'Fechar jogo',
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
      title: 'Encerrar inscrições?',
      message: changed
        ? `${count} inscritos → o formato desce para ${fmt.label}. Vou ajustar o jogo e formar equipas equilibradas.`
        : `${count} inscritos · formato ${fmt.label}. Vou formar equipas equilibradas; os excedentes ficam no banco.`,
      confirmLabel: 'Encerrar e formar',
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
          <h2 className={s.sectionHead}>Eventos</h2>
          {game.status === 'finished' && isOrganizer && (
            <div className={s.infoSlot}>
              <Alert kind="info">
                Fase de revisão: adiciona ou corrige eventos em falta. Ao apurar o MVP/Flop, os
                eventos ficam fechados.
              </Alert>
            </div>
          )}
          {(game.status === 'voting_open' || game.status === 'closed') && (
            <p className={s.closedNote}>Jogo apurado — os eventos estão fechados.</p>
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
        <ChevronLeftIcon width={16} height={16} /> Jogos
      </Link>

      {/* Cabeçalho / placar em destaque (estilo transmissão) */}
      <MatchHeader game={game} clock={clock} />

      {game.notes && <Card className={s.notes}>{game.notes}</Card>}

      {isOrganizer && (
        <Button variant="secondary" block onClick={() => setManageOpen(true)}>
          <WhistleIcon width={18} height={18} /> Gerir jogo
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
        title="Gerir jogo"
        description={GAME_STATUS_LABELS[game.status]}
        variant="sheet"
      >
        <div className={s.modalBody}>
          {updateStatus.isError && <Alert kind="error">Não foi possível atualizar o estado.</Alert>}

          {DETAILS_EDITABLE.includes(game.status) ? (
            <Button
              variant="secondary"
              block
              onClick={() => {
                setManageOpen(false);
                setEditOpen(true);
              }}
            >
              Editar detalhes
            </Button>
          ) : (
            <p className={s.lockedNote}>O jogo já começou — os detalhes estão bloqueados.</p>
          )}

          {(game.status === 'scheduled' || game.status === 'open') && (
            <Button
              block
              onClick={closeRegistrations}
              loading={updateGame.isPending || assignTeams.isPending}
            >
              Encerrar inscrições e formar equipas
            </Button>
          )}

          {/* Terminar (o placar segue os eventos registados) */}
          {game.status === 'in_progress' && (
            <div className={s.resultBox}>
              <p className={s.resultLabel}>Resultado atual (dos eventos)</p>
              <p className={s.resultScore}>
                {game.team_a_score ?? 0} <span className={s.resultDash}>–</span>{' '}
                {game.team_b_score ?? 0}
              </p>
              <Button block onClick={finishGame} loading={updateStatus.isPending}>
                Terminar jogo
              </Button>
            </div>
          )}

          {/* Apurar MVP/Flop (após terminar) — automático ou abre desempate */}
          {game.status === 'finished' && (
            <Button block onClick={resolveGameAwards} loading={resolveAwards.isPending}>
              Apurar MVP/Flop
            </Button>
          )}

          {/* Outras transições */}
          {transitions.filter((t) => t !== 'finished').length > 0 && (
            <div className={s.btnGroup}>
              {transitions
                .filter((t) => t !== 'finished')
                .map((t) => (
                  <Button
                    key={t}
                    block
                    variant={t === 'cancelled' ? 'danger' : t === 'closed' ? 'secondary' : 'primary'}
                    onClick={() => changeStatus(t)}
                    loading={updateStatus.isPending}
                  >
                    {GAME_TRANSITION_LABELS[t] ?? GAME_STATUS_LABELS[t]}
                  </Button>
                ))}
            </div>
          )}

          {noManageActions && (
            <p className={s.emptyNote}>Sem ações disponíveis neste estado.</p>
          )}
        </div>
      </Modal>

      {/* Editar detalhes do jogo */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar jogo"
        variant="sheet"
        size="lg"
      >
        <CreateGameForm game={game} onSuccess={() => setEditOpen(false)} onCancel={() => setEditOpen(false)} />
      </Modal>
    </Page>
  );
}
