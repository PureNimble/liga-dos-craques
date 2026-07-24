import { useContext } from 'react';
import { GroupContext, type GroupContextValue } from '../components/GroupProvider';

/** Reads the active-group context; throws outside a `GroupProvider`. */
export function useActiveGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) {
    throw new Error('useActiveGroup deve ser usado dentro de <GroupProvider>');
  }
  return ctx;
}

/** Shortcut for the active group's id, which most hooks need. */
export function useActiveGroupId(): string {
  return useActiveGroup().groupId;
}
