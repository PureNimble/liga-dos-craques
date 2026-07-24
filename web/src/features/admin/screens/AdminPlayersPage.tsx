import { useState } from 'react';
import { Alert, Avatar, Badge, Button, Card, Field, Input, Select } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePositions } from '@/features/profile/hooks/profileHooks';
import {
  useAdminPlayers,
  useAdminSetPassword,
  useAdminSetRole,
  type AdminPlayer,
} from '../hooks/adminHooks';
import cards from '../adminCards.module.css';
import s from './AdminPlayersPage.module.css';

/** Admin screen for managing player roles and resetting passwords. */
export function AdminPlayersPage() {
  return (
    <>
      <PlayersCard />
      <ResetPasswordCard />
    </>
  );
}

function PlayersCard() {
  const { data: players, isLoading } = useAdminPlayers();
  const { data: positions } = usePositions();

  const positionLabel = (id: number | null) =>
    positions?.find((p) => p.id === id)?.label ?? 'Sem posição';

  return (
    <Card>
      <h2 className={cards.cardTitle}>Jogadores</h2>
      <p className={cards.cardDesc}>
        Promover ou despromover a admin. Os dados do perfil são do próprio jogador.
      </p>

      {isLoading ? (
        <p className={s.muted}>A carregar…</p>
      ) : (
        <ul className={s.list}>
          {players?.map((p) => (
            <PlayerRow key={p.id} player={p} positionLabel={positionLabel(p.main_position_id)} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function PlayerRow({ player, positionLabel }: { player: AdminPlayer; positionLabel: string }) {
  const { user } = useAuth();
  const setRole = useAdminSetRole();
  const confirm = useConfirm();
  const toast = useToast();
  const isSelf = user?.id === player.id;
  const isAdmin = player.role === 'admin';

  async function toggleRole() {
    const next = isAdmin ? 'player' : 'admin';
    const ok = await confirm({
      title: isAdmin ? 'Remover admin?' : 'Tornar admin?',
      message: isAdmin
        ? `${player.name} deixa de ter acesso ao dashboard.`
        : `${player.name} passa a ter acesso total ao dashboard.`,
      confirmLabel: isAdmin ? 'Remover' : 'Promover',
      danger: isAdmin,
    });
    if (!ok) return;
    try {
      await setRole.mutateAsync({ userId: player.id, role: next });
      toast.show('Função atualizada.', 'success');
    } catch {
      toast.show('Não foi possível mudar a função.', 'error');
    }
  }

  return (
    <li className={s.row}>
      <Avatar name={player.name} src={player.photo_url} size="sm" />
      <div className={s.rowText}>
        <span className={s.rowName}>
          {player.name}
          {isAdmin && (
            <Badge tone="green" className={s.roleBadge}>
              Admin
            </Badge>
          )}
        </span>
        <span className={s.rowMeta}>{positionLabel}</span>
      </div>
      <Button
        size="sm"
        variant={isAdmin ? 'ghost' : 'secondary'}
        onClick={toggleRole}
        loading={setRole.isPending}
        disabled={isSelf}
        title={isSelf ? 'Não podes mudar a tua própria função' : undefined}
      >
        {isAdmin ? 'Remover admin' : 'Tornar admin'}
      </Button>
    </li>
  );
}

function ResetPasswordCard() {
  const { data: players } = useAdminPlayers();
  const setPassword = useAdminSetPassword();
  const toast = useToast();
  const [userId, setUserId] = useState('');
  const [password, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!userId) return setError('Escolhe o jogador.');
    if (password.length < 8) return setError('A password deve ter pelo menos 8 caracteres.');
    try {
      await setPassword.mutateAsync({ userId, password });
      setPassword2('');
      toast.show('Password reposta', 'success');
    } catch {
      setError('Não foi possível repor a password.');
    }
  }

  return (
    <Card>
      <h2 className={cards.cardTitle}>Repor password</h2>
      <p className={cards.cardDesc}>
        Define uma nova password para um jogador (sem depender de email). Comunica-lha depois.
      </p>
      {error && (
        <div className={cards.slotTop}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className={cards.form}>
        <Field label="Jogador" htmlFor="reset-user">
          <Select id="reset-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Escolher…</option>
            {players?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nova password" htmlFor="reset-pw" hint="Mínimo 8 caracteres">
          <Input
            id="reset-pw"
            type="text"
            value={password}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <div className={cards.actions}>
          <Button onClick={submit} loading={setPassword.isPending}>
            Definir password
          </Button>
        </div>
      </div>
    </Card>
  );
}
