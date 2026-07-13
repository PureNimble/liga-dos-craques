import { useMemo, useState } from 'react';
import { Alert, Avatar, Badge, Button, Card, Select } from '@/shared/components/ui';
import { useProfilesList } from '@/features/profile/useProfilesList';
import type { GamePlayerStatus } from '@/types/database';
import {
  useAddGamePlayer,
  useRemoveGamePlayer,
  useSetGamePlayerStatus,
  type GamePlayerWithProfile,
} from './gameHooks';

interface PlayerRosterProps {
  gameId: string;
  players: GamePlayerWithProfile[];
  maxPlayers: number;
  canManage: boolean; // organizador/admin
  currentUserId: string;
  editable: boolean; // estado do jogo permite alterar plantel
}

const STATUS_LABEL: Record<GamePlayerStatus, string> = {
  invited: 'Convidado',
  confirmed: 'Confirmado',
  played: 'Jogou',
  no_show: 'Faltou',
};

const STATUS_STYLE: Record<GamePlayerStatus, string> = {
  invited: 'bg-amber-500/15 text-amber-300',
  confirmed: 'bg-pitch-500/15 text-pitch-400',
  played: 'bg-slate-500/20 text-slate-200',
  no_show: 'bg-red-500/15 text-red-300',
};

export function PlayerRoster({
  gameId,
  players,
  maxPlayers,
  canManage,
  currentUserId,
  editable,
}: PlayerRosterProps) {
  const { data: allProfiles } = useProfilesList();
  const addPlayer = useAddGamePlayer(gameId);
  const removePlayer = useRemoveGamePlayer(gameId);
  const setStatus = useSetGamePlayerStatus(gameId);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isInGame = players.some((p) => p.player_id === currentUserId);
  const confirmedCount = players.filter(
    (p) => p.status === 'confirmed' || p.status === 'played',
  ).length;
  // maxPlayers = jogadores em campo (formato). Inscrições não têm limite:
  // quem passar disso fica suplente.
  const subs = Math.max(0, players.length - maxPlayers);

  const availableProfiles = useMemo(() => {
    const inGame = new Set(players.map((p) => p.player_id));
    return (allProfiles ?? []).filter((p) => !inGame.has(p.id));
  }, [allProfiles, players]);

  async function handleAdd(playerId: string, status: GamePlayerStatus) {
    setError(null);
    try {
      await addPlayer.mutateAsync({ playerId, status });
      setSelectedId('');
    } catch {
      setError('Não foi possível adicionar o jogador.');
    }
  }

  async function handleRemove(gamePlayerId: string) {
    setError(null);
    try {
      await removePlayer.mutateAsync(gamePlayerId);
    } catch {
      setError('Não foi possível remover o jogador.');
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-slate-100">Jogadores</h2>
        <span className="rounded-full bg-navy-800 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-400">
          {players.length} inscritos · {confirmedCount} conf.
          {subs > 0 && <span className="text-amber-400"> · {subs} supl.</span>}
        </span>
      </div>

      {error && (
        <div className="mb-3">
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {players.length === 0 ? (
        <p className="text-sm text-slate-400">Ainda ninguém está inscrito.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-navy-800">
          {players.map((gp) => {
            const isSelf = gp.player_id === currentUserId;
            return (
              <li key={gp.id} className="flex items-center justify-between gap-2 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={gp.profile?.name ?? '?'} src={gp.profile?.photo_url ?? null} size="sm" />
                  <span className="truncate text-sm font-medium text-slate-100">
                    {gp.profile?.name ?? 'Jogador'}
                  </span>
                  {gp.team && (
                    <Badge className="bg-navy-800 text-slate-300">{gp.team}</Badge>
                  )}
                  <Badge className={STATUS_STYLE[gp.status]}>{STATUS_LABEL[gp.status]}</Badge>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Confirmar/recusar a própria presença */}
                  {editable && isSelf && gp.status !== 'confirmed' && (
                    <button
                      onClick={() => setStatus.mutate({ gamePlayerId: gp.id, status: 'confirmed' })}
                      className="text-xs text-pitch-400 hover:underline"
                    >
                      Confirmar
                    </button>
                  )}
                  {editable && isSelf && gp.status === 'confirmed' && (
                    <button
                      onClick={() => setStatus.mutate({ gamePlayerId: gp.id, status: 'invited' })}
                      className="text-xs text-slate-400 hover:underline"
                    >
                      Desmarcar
                    </button>
                  )}
                  {editable && (canManage || isSelf) && (
                    <button
                      onClick={() => handleRemove(gp.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editable && (
        <div className="mt-4 flex flex-col gap-2 border-t border-navy-800 pt-4">
          {canManage && (
            <div className="flex gap-2">
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">Convidar jogador…</option>
                {availableProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="secondary"
                disabled={!selectedId}
                loading={addPlayer.isPending}
                onClick={() => selectedId && handleAdd(selectedId, 'invited')}
              >
                Convidar
              </Button>
            </div>
          )}

          {!canManage &&
            (isInGame ? (
              <p className="text-sm text-slate-400">Estás neste jogo.</p>
            ) : (
              <Button
                type="button"
                loading={addPlayer.isPending}
                onClick={() => handleAdd(currentUserId, 'confirmed')}
              >
                Inscrever-me
              </Button>
            ))}
        </div>
      )}
    </Card>
  );
}
