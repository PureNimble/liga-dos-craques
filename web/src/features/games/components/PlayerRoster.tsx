import { useMemo, useState } from 'react';
import { Alert, Avatar, Badge, Button, Card, Select, type BadgeTone } from '@/shared/components/ui';
import { useGroupMembers } from '@/features/groups/hooks/groupHooks';
import { useT } from '@/shared/i18n/useT';
import type { GamePlayerStatus } from '@/types/database';
import {
  useAddGamePlayer,
  useRemoveGamePlayer,
  useSetGamePlayerStatus,
  type GamePlayerWithProfile,
} from '../hooks/gameHooks';
import s from './PlayerRoster.module.css';

interface PlayerRosterProps {
  gameId: string;
  groupId: string;
  players: GamePlayerWithProfile[];
  maxPlayers: number;
  canManage: boolean;
  currentUserId: string;
  editable: boolean;
}

const STATUS_KEY: Record<GamePlayerStatus, string> = {
  invited: 'games.roster.status.invited',
  confirmed: 'games.roster.status.confirmed',
  played: 'games.roster.status.played',
  no_show: 'games.roster.status.no_show',
};

const STATUS_TONE: Record<GamePlayerStatus, BadgeTone> = {
  invited: 'amber',
  confirmed: 'green',
  played: 'gray',
  no_show: 'red',
};

/** Manages a game's player list: invites, status changes, and self-registration. */
export function PlayerRoster({
  gameId,
  groupId,
  players,
  maxPlayers,
  canManage,
  currentUserId,
  editable,
}: PlayerRosterProps) {
  const { t } = useT();
  const { data: allProfiles } = useGroupMembers(groupId);
  const addPlayer = useAddGamePlayer(gameId);
  const removePlayer = useRemoveGamePlayer(gameId);
  const setStatus = useSetGamePlayerStatus(gameId);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isInGame = players.some((p) => p.player_id === currentUserId);
  const confirmedCount = players.filter(
    (p) => p.status === 'confirmed' || p.status === 'played',
  ).length;
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
      setError(t('games.roster.addError'));
    }
  }

  async function handleRemove(gamePlayerId: string) {
    setError(null);
    try {
      await removePlayer.mutateAsync(gamePlayerId);
    } catch {
      setError(t('games.roster.removeError'));
    }
  }

  return (
    <Card>
      <div className={s.head}>
        <h2 className={s.title}>{t('games.roster.title')}</h2>
        <span className={s.count}>
          {t('games.roster.count', { count: players.length, confirmed: confirmedCount })}
          {subs > 0 && (
            <span className={s.countSubs}> · {t('games.roster.subs', { count: subs })}</span>
          )}
        </span>
      </div>

      {error && (
        <div className={s.errorSlot}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {players.length === 0 ? (
        <p className={s.empty}>{t('games.roster.empty')}</p>
      ) : (
        <ul className={s.list}>
          {players.map((gp) => {
            const isSelf = gp.player_id === currentUserId;
            return (
              <li key={gp.id} className={s.item}>
                <div className={s.player}>
                  <Avatar
                    name={gp.profile?.name ?? '?'}
                    src={gp.profile?.photo_url ?? null}
                    size="sm"
                  />
                  <span className={s.name}>{gp.profile?.name ?? t('games.roster.fallbackName')}</span>
                  {gp.team && <Badge tone="gray">{gp.team}</Badge>}
                  <Badge tone={STATUS_TONE[gp.status]}>{t(STATUS_KEY[gp.status])}</Badge>
                </div>

                <div className={s.actions}>
                  {editable && isSelf && gp.status !== 'confirmed' && (
                    <button
                      onClick={() => setStatus.mutate({ gamePlayerId: gp.id, status: 'confirmed' })}
                      className={`${s.link} ${s.linkConfirm}`}
                    >
                      {t('games.roster.confirm')}
                    </button>
                  )}
                  {editable && isSelf && gp.status === 'confirmed' && (
                    <button
                      onClick={() => setStatus.mutate({ gamePlayerId: gp.id, status: 'invited' })}
                      className={`${s.link} ${s.linkNeutral}`}
                    >
                      {t('games.roster.unconfirm')}
                    </button>
                  )}
                  {editable && (canManage || isSelf) && (
                    <button
                      onClick={() => handleRemove(gp.id)}
                      className={`${s.link} ${s.linkDanger}`}
                    >
                      {t('games.roster.remove')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editable && (
        <div className={s.addRow}>
          {canManage && (
            <div className={s.invite}>
              <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">{t('games.roster.invitePlaceholder')}</option>
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
                {t('games.roster.invite')}
              </Button>
            </div>
          )}

          {!canManage &&
            (isInGame ? (
              <p className={s.note}>{t('games.roster.alreadyIn')}</p>
            ) : (
              <Button
                type="button"
                loading={addPlayer.isPending}
                onClick={() => handleAdd(currentUserId, 'confirmed')}
              >
                {t('games.roster.joinMe')}
              </Button>
            ))}
        </div>
      )}
    </Card>
  );
}
