import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { GroupRole, GroupVisibility } from '@/types/database';

/** A group the current player belongs to, with role and membership metadata. */
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

/** A public group the current player has not yet joined. */
export interface PublicGroup {
  id: string;
  name: string;
  created_at: string;
}

/** Public groups the player hasn't joined yet, for discovery. */
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

/** Groups the authenticated player belongs to. */
export function useMyGroups() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ['my_groups', userId],
    enabled: Boolean(userId),
    queryFn: () => fetchMyGroups(userId as string),
  });
}

/** Suspense variant of {@link useMyGroups}; only for protected routes where the session is guaranteed. */
export function useMyGroupsSuspense() {
  const { user } = useAuth();
  return useSuspenseQuery({
    queryKey: ['my_groups', user?.id],
    queryFn: () => fetchMyGroups(user?.id as string),
  });
}

/** Summary of a group member, as used in player pickers. */
export interface GroupMemberSummary {
  id: string;
  name: string;
  photo_url: string | null;
  role: GroupRole;
}

/** Members of a group, used in player pickers (games, challenges, group management). */
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

/** Input for creating a new group. */
export interface CreateGroupInput {
  name: string;
  visibility: GroupVisibility;
}

/** Creates a new group with the current player as its admin. */
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

/** Joins a group using its invite code. */
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

/** Joins a public group directly, without an invite code. */
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

/** Toggles a group between public and private (admins only). */
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

/** Updates the group's name/photo (admins only). */
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

/** Regenerates the group's invite code, invalidating the previous one. */
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

/** Persists which group is the player's active group. */
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

/** Thrown when the DELETE policy silently blocks removing the last admin of a group with other members. */
export class LastAdminError extends Error {
  constructor() {
    super('O grupo ficaria sem admin. Promove outro membro primeiro.');
  }
}

/** Leaves the group (removes the player's own membership row). */
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

/** Removes a member from the group (admins only; the last-admin protection is enforced server-side). */
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

/** Promotes a member to admin (admins only). */
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

