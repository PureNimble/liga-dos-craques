import { useContext } from 'react';
import { GroupContext, type GroupContextValue } from '../components/GroupProvider';

export function useActiveGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) {
    throw new Error('useActiveGroup deve ser usado dentro de <GroupProvider>');
  }
  return ctx;
}

/** Atalho para o id do grupo ativo — é o que a maioria dos hooks precisa. */
export function useActiveGroupId(): string {
  return useActiveGroup().groupId;
}
