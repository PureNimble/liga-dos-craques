import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FullProfile } from '@/features/profile/profileHooks';
import { useSetActiveGroup, type MyGroupRow } from './groupHooks';

export interface GroupContextValue {
  groupId: string;
  activeGroup: MyGroupRow;
  myGroups: MyGroupRow[];
  switchGroup: (groupId: string) => void;
  switching: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const GroupContext = createContext<GroupContextValue | undefined>(undefined);

/**
 * Só é montado com `myGroups` não vazio (AppLayout mostra o onboarding
 * enquanto for []) — por isso o contexto expõe sempre um `groupId` garantido.
 */
export function GroupProvider({
  profile,
  myGroups,
  children,
}: {
  profile: FullProfile;
  myGroups: MyGroupRow[];
  children: ReactNode;
}) {
  const [localGroupId, setLocalGroupId] = useState<string>(
    () => profile.active_group_id ?? myGroups[0]?.group_id ?? '',
  );
  const setActiveGroup = useSetActiveGroup();
  const { mutate: persistActiveGroup } = setActiveGroup;

  // Se o grupo guardado deixou de ser válido (saiu do grupo / foi removido),
  // cai para o primeiro disponível e corrige o valor persistido.
  useEffect(() => {
    if (myGroups.length > 0 && !myGroups.some((g) => g.group_id === localGroupId)) {
      const fallback = myGroups[0].group_id;
      setLocalGroupId(fallback);
      persistActiveGroup(fallback);
    }
  }, [myGroups, localGroupId, persistActiveGroup]);

  const activeGroup = myGroups.find((g) => g.group_id === localGroupId) ?? myGroups[0];

  const value = useMemo<GroupContextValue | null>(() => {
    if (!activeGroup) return null;
    return {
      groupId: activeGroup.group_id,
      activeGroup,
      myGroups,
      switchGroup: (id: string) => {
        setLocalGroupId(id);
        persistActiveGroup(id);
      },
      switching: setActiveGroup.isPending,
    };
  }, [activeGroup, myGroups, persistActiveGroup, setActiveGroup.isPending]);

  // Só acontece por uma fração de segundo, entre myGroups passar a [] (saiu do
  // último grupo) e o AppLayout voltar a suspender para mostrar o onboarding.
  if (!value) return null;

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}
