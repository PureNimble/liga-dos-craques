import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { GroupRole, GroupVisibility } from '@/types/database';

export interface MyGroupRow {
  group_id: string;
  role: GroupRole;
  joined_at: string;
  name: string;
  invite_code: string;
  visibility: GroupVisibility;
  photo_url: string | null;
}

interface GroupJoin {
  name: string;
  invite_code: string;
  visibility: GroupVisibility;
  photo_url: string | null;
}

async function fetchMyGroups(userId: string): Promise<MyGroupRow[]> {
  const { data, error } = await supabase
    .from('group_member')
    .select('group_id, role, joined_at, app_group:group_id(name, invite_code, visibility, photo_url)')
    .eq('player_id', userId)
    .order('joined_at');
  if (error) throw error;
  return (data ?? []).map((r) => {
    const g = r.app_group as unknown as GroupJoin | null;
    return {
      group_id: r.group_id,
      role: r.role,
      joined_at: r.joined_at,
      name: g?.name ?? '',
      invite_code: g?.invite_code ?? '',
      visibility: g?.visibility ?? 'private',
      photo_url: g?.photo_url ?? null,
    };
  });
}

export interface PublicGroup {
  id: string;
  name: string;
  created_at: string;
}

/** Grupos públicos que o utilizador ainda não integra — para o descobrir/entrar. */
export function usePublicGroups() {
  const { data: myGroups } = useMyGroups();
  return useQuery({
    queryKey: ['public_groups', myGroups?.map((g) => g.group_id).join(',')],
    enabled: Boolean(myGroups),
    queryFn: async (): Promise<PublicGroup[]> => {
      const { data, error } = await supabase
        .from('app_group')
        .select('id, name, created_at')
        .eq('visibility', 'public')
        .order('name');
      if (error) throw error;
      const mine = new Set((myGroups ?? []).map((g) => g.group_id));
      return (data ?? []).filter((g) => !mine.has(g.id));
    },
  });
}

/** Grupos do utilizador autenticado. */
export function useMyGroups() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ['my_groups', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyGroups(userId as string),
  });
}

/** Variante Suspense: usar só em rotas protegidas (AppLayout), onde a sessão já está garantida. */
export function useMyGroupsSuspense() {
  const { user } = useAuth();
  return useSuspenseQuery({
    queryKey: ['my_groups', user?.id],
    queryFn: () => fetchMyGroups(user?.id as string),
  });
}

export interface GroupMemberSummary {
  id: string;
  name: string;
  photo_url: string | null;
  role: GroupRole;
}

/** Membros de um grupo — usado nos seletores de jogadores (jogos, desafios, gestão do grupo). */
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group_members', groupId],
    enabled: Boolean(groupId),
    queryFn: async (): Promise<GroupMemberSummary[]> => {
      const { data, error } = await supabase
        .from('group_member')
        .select('role, profile:player_id(id, name, photo_url)')
        .eq('group_id', groupId as string);
      if (error) throw error;
      return (data ?? [])
        .map((r) => {
          const p = r.profile as unknown as { id: string; name: string; photo_url: string | null };
          return { id: p.id, name: p.name, photo_url: p.photo_url, role: r.role };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    staleTime: 60_000,
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations — grupo                                                          */
/* -------------------------------------------------------------------------- */
export interface CreateGroupInput {
  name: string;
  visibility: GroupVisibility;
}

export function useCreateGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGroupInput): Promise<string> => {
      const { data, error } = await supabase.rpc('create_group', {
        p_name: input.name,
        p_visibility: input.visibility,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_groups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useJoinGroupByCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      const { data, error } = await supabase.rpc('join_group_by_code', { p_code: code });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_groups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

/** Entra diretamente num grupo público (sem código). */
export function useJoinPublicGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.rpc('join_public_group', { p_group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_groups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['public_groups'] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

/** Alterna público/privado (só admins do grupo). */
export function useSetGroupVisibility() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; visibility: GroupVisibility }) => {
      const { error } = await supabase.rpc('set_group_visibility', {
        p_group_id: input.groupId,
        p_visibility: input.visibility,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_groups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['public_groups'] });
    },
  });
}

/** Atualiza nome/foto do grupo (só admins do grupo). */
export function useUpdateGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; name: string; photoUrl: string | null }) => {
      const { error } = await supabase.rpc('update_group', {
        p_group_id: input.groupId,
        p_name: input.name,
        p_photo_url: input.photoUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my_groups', user?.id] }),
  });
}

export function useRegenerateInviteCode() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('regenerate_invite_code', { p_group_id: groupId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my_groups', user?.id] }),
  });
}

export function useSetActiveGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.rpc('set_active_group', { p_group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }),
  });
}

/** A policy de DELETE bloqueia (0 linhas, sem erro) sair/remover o último admin de um grupo com outros membros. */
export class LastAdminError extends Error {
  constructor() {
    super('O grupo ficaria sem admin. Promove outro membro primeiro.');
  }
}

/** Sair do grupo (a própria linha) — a policy de DELETE cobre isto diretamente. */
export function useLeaveGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase
        .from('group_member')
        .delete()
        .eq('group_id', groupId)
        .eq('player_id', user!.id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new LastAdminError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_groups', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

/** Remover um membro (só admins do grupo — a policy de DELETE valida, incl. proteção do último admin). */
export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: string) => {
      const { data, error } = await supabase
        .from('group_member')
        .delete()
        .eq('group_id', groupId)
        .eq('player_id', playerId)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new LastAdminError();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group_members', groupId] }),
  });
}

/** Promove um membro a admin (só admins do grupo). */
export function usePromoteGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase.rpc('promote_group_member', {
        p_group_id: groupId,
        p_player_id: playerId,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group_members', groupId] }),
  });
}

