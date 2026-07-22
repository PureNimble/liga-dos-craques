import { useState } from 'react';
import { Avatar, Badge, Button, Field, Input, Modal, SegmentedTabs } from '@/shared/components/ui';
import { useConfirm } from '@/shared/components/ui/ConfirmDialog';
import { useToast } from '@/shared/components/toast/useToast';
import type { GroupVisibility } from '@/types/database';
import { useActiveGroup } from './useActiveGroup';
import { AddGroupModal } from './AddGroupModal';
import { GroupAvatarUpload } from './GroupAvatarUpload';
import {
  LastAdminError,
  type MyGroupRow,
  useGroupMembers,
  useLeaveGroup,
  usePromoteGroupMember,
  useRegenerateInviteCode,
  useRemoveGroupMember,
  useSetGroupVisibility,
  useUpdateGroup,
} from './groupHooks';
import s from './GroupSwitcherModal.module.css';

const VISIBILITY_LABEL: Record<GroupVisibility, string> = { private: 'Privado', public: 'Público' };

interface GroupSwitcherModalProps {
  onClose: () => void;
  /** Grupo cujas definições mostrar — omitir usa o grupo ativo (troca do Navbar/rail). */
  groupId?: string;
}

/**
 * Lista "os teus grupos" (troca) + definições de UM grupo específico —
 * `groupId`, se dado, deixa gerir um grupo sem ter de o tornar ativo primeiro
 * (clique direito/duplo clique num círculo da coluna).
 */
export function GroupSwitcherModal({ onClose, groupId: targetGroupId }: GroupSwitcherModalProps) {
  const { groupId: activeGroupId, myGroups, switchGroup } = useActiveGroup();
  const [addOpen, setAddOpen] = useState(false);

  // Um groupId explícito (clique direito/duplo clique na coluna) significa
  // "só quero ver ESTE grupo" — esconde a lista de troca, que só faz sentido
  // no modo genérico (Navbar no telemóvel, sem coluna para trocar por lá).
  const scoped = targetGroupId !== undefined;
  const groupId = targetGroupId ?? activeGroupId;
  const group = myGroups.find((g) => g.group_id === groupId);
  const isAdmin = group?.role === 'admin';

  return (
    <Modal open onClose={onClose} title={scoped ? (group?.name ?? 'Grupo') : 'Grupos'} size="lg">
      <div className={s.body}>
        {!scoped && (
          <section>
            <h3 className={s.sectionTitle}>Os teus grupos</h3>
            <ul className={s.groupList}>
              {myGroups.map((g) => (
                <li key={g.group_id}>
                  <button
                    type="button"
                    className={[s.groupItem, g.group_id === activeGroupId ? s.groupItemActive : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => switchGroup(g.group_id)}
                  >
                    <span className={s.groupItemInfo}>
                      <Avatar name={g.name} src={g.photo_url} size="sm" />
                      <span className={s.groupName}>{g.name}</span>
                    </span>
                    <Badge tone={g.role === 'admin' ? 'indigo' : 'gray'}>
                      {g.role === 'admin' ? 'Admin' : 'Membro'}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className={s.addLink} onClick={() => setAddOpen(true)}>
              + Adicionar grupo
            </button>
          </section>
        )}

        {group && (
          <section>
            {!scoped && <h3 className={s.sectionTitle}>{group.name}</h3>}
            <GroupIdentityCard key={groupId} group={group} isAdmin={isAdmin} />
            {isAdmin && <VisibilityCard groupId={groupId} visibility={group.visibility} />}
            {isAdmin && <InviteCodeCard groupId={groupId} inviteCode={group.invite_code} />}
            <MembersCard groupId={groupId} isAdmin={isAdmin} />
            <LeaveGroupRow groupId={groupId} groupName={group.name} onClose={onClose} />
          </section>
        )}
      </div>

      {addOpen && <AddGroupModal onClose={() => setAddOpen(false)} />}
    </Modal>
  );
}

function GroupIdentityCard({ group, isAdmin }: { group: MyGroupRow; isAdmin: boolean }) {
  const updateGroup = useUpdateGroup();
  const toast = useToast();
  const [name, setName] = useState(group.name);

  async function handlePhotoUploaded(photoUrl: string) {
    try {
      await updateGroup.mutateAsync({ groupId: group.group_id, name: group.name, photoUrl });
      toast.show('Foto do grupo atualizada.', 'success');
    } catch {
      toast.show('Não foi possível guardar a foto.', 'error');
    }
  }

  async function saveName() {
    const trimmed = name.trim();
    if (trimmed === group.name) return;
    if (trimmed.length < 2 || trimmed.length > 60) {
      toast.show('O nome tem de ter entre 2 e 60 caracteres.', 'error');
      return;
    }
    try {
      await updateGroup.mutateAsync({
        groupId: group.group_id,
        name: trimmed,
        photoUrl: group.photo_url,
      });
      toast.show('Nome do grupo atualizado.', 'success');
    } catch {
      toast.show('Não foi possível guardar o nome.', 'error');
    }
  }

  if (!isAdmin) {
    return (
      <div className={s.identityRow}>
        <Avatar name={group.name} src={group.photo_url} size="xl" />
      </div>
    );
  }

  return (
    <div className={s.identityCard}>
      <GroupAvatarUpload
        groupId={group.group_id}
        photoUrl={group.photo_url}
        name={group.name}
        onUploaded={handlePhotoUploaded}
      />
      <Field label="Nome do grupo" htmlFor="group-edit-name">
        <div className={s.nameRow}>
          <Input id="group-edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            size="sm"
            variant="secondary"
            onClick={saveName}
            loading={updateGroup.isPending}
            disabled={name.trim() === group.name}
          >
            Guardar
          </Button>
        </div>
      </Field>
    </div>
  );
}

function VisibilityCard({ groupId, visibility }: { groupId: string; visibility: GroupVisibility }) {
  const setVisibility = useSetGroupVisibility();
  const toast = useToast();

  async function change(next: GroupVisibility) {
    if (next === visibility) return;
    try {
      await setVisibility.mutateAsync({ groupId, visibility: next });
      toast.show(next === 'public' ? 'Grupo tornado público.' : 'Grupo tornado privado.', 'success');
    } catch {
      toast.show('Não foi possível alterar a visibilidade.', 'error');
    }
  }

  return (
    <div className={s.inviteCodeRow}>
      <div>
        <p className={s.label}>Visibilidade</p>
        <p className={s.code}>{VISIBILITY_LABEL[visibility]}</p>
      </div>
      <SegmentedTabs<GroupVisibility>
        value={visibility}
        onChange={change}
        items={[
          { value: 'private', label: VISIBILITY_LABEL.private },
          { value: 'public', label: VISIBILITY_LABEL.public },
        ]}
      />
    </div>
  );
}

function InviteCodeCard({ groupId, inviteCode }: { groupId: string; inviteCode: string }) {
  const regenerate = useRegenerateInviteCode();
  const toast = useToast();
  const confirm = useConfirm();

  async function handleRegenerate() {
    const ok = await confirm({
      title: 'Gerar novo código?',
      message: 'O código atual deixa de funcionar.',
    });
    if (!ok) return;
    try {
      await regenerate.mutateAsync(groupId);
      toast.show('Novo código gerado.', 'success');
    } catch {
      toast.show('Não foi possível gerar um novo código.', 'error');
    }
  }

  return (
    <div className={s.inviteCodeRow}>
      <div>
        <p className={s.label}>Código de convite</p>
        <p className={s.code}>{inviteCode}</p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleRegenerate}
        loading={regenerate.isPending}
      >
        Gerar novo
      </Button>
    </div>
  );
}

function MembersCard({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const { data: members } = useGroupMembers(groupId);
  const removeMember = useRemoveGroupMember(groupId);
  const promoteMember = usePromoteGroupMember(groupId);
  const toast = useToast();
  const confirm = useConfirm();

  async function remove(playerId: string, name: string) {
    const ok = await confirm({ title: `Remover ${name} do grupo?`, danger: true });
    if (!ok) return;
    try {
      await removeMember.mutateAsync(playerId);
    } catch (e) {
      toast.show(e instanceof LastAdminError ? e.message : 'Não foi possível remover o membro.', 'error');
    }
  }

  async function promote(playerId: string, name: string) {
    const ok = await confirm({ title: `Tornar ${name} admin?`, message: 'Passa a gerir o grupo.' });
    if (!ok) return;
    try {
      await promoteMember.mutateAsync(playerId);
      toast.show(`${name} agora é admin.`, 'success');
    } catch {
      toast.show('Não foi possível promover este membro.', 'error');
    }
  }

  return (
    <div>
      <p className={s.label}>Membros ({members?.length ?? 0})</p>
      <ul className={s.memberList}>
        {members?.map((m) => (
          <li key={m.id} className={s.memberItem}>
            <div className={s.memberInfo}>
              <Avatar name={m.name} src={m.photo_url} size="sm" />
              <span>{m.name}</span>
              <Badge tone={m.role === 'admin' ? 'indigo' : 'gray'}>
                {m.role === 'admin' ? 'Admin' : 'Membro'}
              </Badge>
            </div>
            {isAdmin && m.role !== 'admin' && (
              <div className={s.memberActions}>
                <button className={s.promoteLink} onClick={() => promote(m.id, m.name)}>
                  Tornar admin
                </button>
                <button className={s.removeLink} onClick={() => remove(m.id, m.name)}>
                  Remover
                </button>
              </div>
            )}
            {isAdmin && m.role === 'admin' && (
              <button className={s.removeLink} onClick={() => remove(m.id, m.name)}>
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LeaveGroupRow({
  groupId,
  groupName,
  onClose,
}: {
  groupId: string;
  groupName: string;
  onClose: () => void;
}) {
  const leaveGroup = useLeaveGroup();
  const toast = useToast();
  const confirm = useConfirm();

  async function leave() {
    const ok = await confirm({ title: `Sair de ${groupName}?`, danger: true });
    if (!ok) return;
    try {
      await leaveGroup.mutateAsync(groupId);
      onClose();
    } catch (e) {
      toast.show(e instanceof LastAdminError ? e.message : 'Não foi possível sair do grupo.', 'error');
    }
  }

  return (
    <div className={s.leaveRow}>
      <Button variant="danger" size="sm" onClick={leave} loading={leaveGroup.isPending}>
        Sair deste grupo
      </Button>
    </div>
  );
}
