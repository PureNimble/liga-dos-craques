import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FullProfile } from '@/features/profile/hooks/profileHooks';
import { useSetActiveGroup, type MyGroupRow } from '../hooks/groupHooks';

/** Shape of the active-group context value. */
export interface GroupContextValue {
  groupId: string;
  activeGroup: MyGroupRow;
  myGroups: MyGroupRow[];
  switchGroup: (groupId: string) => void;
  switching: boolean;
}

/** React context carrying the active group and the player's group list. */
// eslint-disable-next-line react-refresh/only-export-components
export const GroupContext = createContext<GroupContextValue | undefined>(undefined);

/** Provides the active group; only mounted once `myGroups` is non-empty. */
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

  if (!value) return null;

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}
