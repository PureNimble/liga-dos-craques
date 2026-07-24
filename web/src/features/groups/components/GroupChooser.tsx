import { useState, type ReactNode } from 'react';
import { Alert, Button, Field, Input, Loading, SegmentedTabs } from '@/shared/components/ui';
import { useToast } from '@/shared/components/toast/useToast';
import { ChevronLeftIcon, SearchIcon, UsersIcon, WhistleIcon } from '@/shared/components/ui/icons';
import type { GroupVisibility } from '@/types/database';
import { useCreateGroup, useJoinGroupByCode, useJoinPublicGroup, usePublicGroups } from '../hooks/groupHooks';
import { createGroupSchema, joinGroupSchema } from '../schemas/group.schemas';
import s from './GroupChooser.module.css';

type Mode = 'choose' | 'create' | 'join' | 'browse';

const VISIBILITY_LABEL: Record<GroupVisibility, string> = { private: 'Privado', public: 'Público' };

/**
 * Escolher um grupo: criar um novo ou entrar num existente (código ou
 * público). Usado a página inteira no onboarding (sem grupo nenhum) e dentro
 * de um modal a partir da coluna de grupos (`GroupRail`, "+") quando já se
 * tem pelo menos um grupo.
 *
 * `onDone`, se dado, corre depois de qualquer ação bem-sucedida (criar,
 * entrar) — o chamador usa para fechar o modal. No onboarding não é preciso:
 * a própria página desmonta-se sozinha assim que `myGroups` deixa de estar
 * vazio.
 */
export function GroupChooser({ onDone }: { onDone?: () => void }) {
  const [mode, setMode] = useState<Mode>('choose');

  return (
    <div className={s.content} key={mode}>
      {mode === 'choose' && (
        <div className={s.choices}>
          <ChoiceTile
            icon={<WhistleIcon width={22} height={22} />}
            title="Criar um grupo"
            description="Ficas como admin — convida os teus amigos depois."
            onClick={() => setMode('create')}
          />
          <ChoiceTile
            icon={<UsersIcon width={22} height={22} />}
            title="Entrar com código"
            description="Pede o código a quem já está no grupo."
            onClick={() => setMode('join')}
          />
          <ChoiceTile
            icon={<SearchIcon width={22} height={22} />}
            title="Grupos públicos"
            description="Descobre um grupo aberto e entra sem código."
            onClick={() => setMode('browse')}
            wide
          />
        </div>
      )}

      {mode === 'create' && <CreateGroupForm onBack={() => setMode('choose')} onDone={onDone} />}
      {mode === 'join' && <JoinGroupForm onBack={() => setMode('choose')} onDone={onDone} />}
      {mode === 'browse' && <BrowsePublicGroups onBack={() => setMode('choose')} onDone={onDone} />}
    </div>
  );
}

function ChoiceTile({
  icon,
  title,
  description,
  onClick,
  wide = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={[s.tile, wide ? s.tileWide : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <span className={s.tileIcon}>{icon}</span>
      <span className={s.tileText}>
        <span className={s.tileTitle}>{title}</span>
        <span className={s.tileDesc}>{description}</span>
      </span>
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={s.back} onClick={onClick}>
      <ChevronLeftIcon width={16} height={16} />
      Escolher outra opção
    </button>
  );
}

function JoinGroupForm({ onBack, onDone }: { onBack: () => void; onDone?: () => void }) {
  const joinByCode = useJoinGroupByCode();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const parsed = joinGroupSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Código inválido.');
      return;
    }
    try {
      await joinByCode.mutateAsync(parsed.data.code);
      toast.show('Entraste no grupo!', 'success');
      onDone?.();
    } catch {
      setError('Código inválido.');
    }
  }

  return (
    <div className={s.formCard}>
      <BackButton onClick={onBack} />
      <h2 className={s.formTitle}>Entrar com código</h2>
      <p className={s.formDesc}>Pede o código de convite a quem já está no grupo.</p>
      {error && (
        <div className={s.slotTop}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className={s.form}>
        <Field label="Código de convite" htmlFor="join-code">
          <Input
            id="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            autoFocus
          />
        </Field>
        <Button block onClick={submit} loading={joinByCode.isPending}>
          Entrar
        </Button>
      </div>
    </div>
  );
}

function CreateGroupForm({ onBack, onDone }: { onBack: () => void; onDone?: () => void }) {
  const createGroup = useCreateGroup();
  const toast = useToast();
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<GroupVisibility>('private');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const parsed = createGroupSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Nome inválido.');
      return;
    }
    try {
      await createGroup.mutateAsync({ name: parsed.data.name, visibility });
      toast.show('Grupo criado!', 'success');
      onDone?.();
    } catch {
      setError('Não foi possível criar o grupo.');
    }
  }

  return (
    <div className={s.formCard}>
      <BackButton onClick={onBack} />
      <h2 className={s.formTitle}>Criar um grupo novo</h2>
      <p className={s.formDesc}>Ficas como admin — depois convida os teus amigos com o código ou diretamente.</p>
      {error && (
        <div className={s.slotTop}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}
      <div className={s.form}>
        <Field label="Nome do grupo" htmlFor="group-name">
          <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Visibilidade" htmlFor="group-visibility">
          <SegmentedTabs<GroupVisibility>
            value={visibility}
            onChange={setVisibility}
            items={[
              { value: 'private', label: VISIBILITY_LABEL.private },
              { value: 'public', label: VISIBILITY_LABEL.public },
            ]}
          />
          <p className={s.visibilityHint}>
            {visibility === 'private'
              ? 'Só entra quem tiver o código de convite.'
              : 'Aparece na lista de grupos públicos — qualquer jogador pode entrar.'}
          </p>
        </Field>
        <Button block onClick={submit} loading={createGroup.isPending}>
          Criar grupo
        </Button>
      </div>
    </div>
  );
}

function BrowsePublicGroups({ onBack, onDone }: { onBack: () => void; onDone?: () => void }) {
  const { data: groups, isLoading } = usePublicGroups();
  const joinPublic = useJoinPublicGroup();
  const toast = useToast();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  async function join(groupId: string) {
    setJoiningId(groupId);
    try {
      await joinPublic.mutateAsync(groupId);
      toast.show('Entraste no grupo!', 'success');
      onDone?.();
    } catch {
      toast.show('Não foi possível entrar neste grupo.', 'error');
      setJoiningId(null);
    }
  }

  return (
    <div className={s.formCard}>
      <BackButton onClick={onBack} />
      <h2 className={s.formTitle}>Grupos públicos</h2>
      <p className={s.formDesc}>Aberto a todos — entra com um toque, sem código.</p>

      {isLoading ? (
        <Loading />
      ) : groups && groups.length > 0 ? (
        <ul className={s.publicList}>
          {groups.map((g) => (
            <li key={g.id} className={s.publicItem}>
              <span className={s.publicName}>{g.name}</span>
              <Button
                size="sm"
                onClick={() => join(g.id)}
                loading={joinPublic.isPending && joiningId === g.id}
              >
                Entrar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.publicEmpty}>Ainda não há grupos públicos. Cria um e convida os teus amigos.</p>
      )}
    </div>
  );
}
