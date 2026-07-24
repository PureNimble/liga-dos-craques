import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database, PositionCategory, PreferredFoot } from '@/types/database';

/** Row of the profile table. */
export type Profile = Database['public']['Tables']['profile']['Row'];
/** Update payload for the profile table. */
export type ProfileUpdate = Database['public']['Tables']['profile']['Update'];
/** Row of the profile_private table. */
export type ProfilePrivate = Database['public']['Tables']['profile_private']['Row'];
/** Row of the position table. */
export type Position = Database['public']['Tables']['position']['Row'];

/** The current user's full profile: public and private fields plus secondary positions. */
export interface FullProfile extends Profile {
  birth_date: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  secondaryPositionIds: number[];
}

async function fetchProfile(userId: string): Promise<FullProfile> {
  const [profileRes, privateRes, secposRes] = await Promise.all([
    supabase.from('profile').select('*').eq('id', userId).single(),
    supabase.from('profile_private').select('*').eq('id', userId).maybeSingle(),
    supabase.from('secondary_position').select('position_id').eq('profile_id', userId),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (privateRes.error) throw privateRes.error;
  if (secposRes.error) throw secposRes.error;

  return {
    ...profileRes.data,
    birth_date: privateRes.data?.birth_date ?? null,
    weight_kg: privateRes.data?.weight_kg ?? null,
    height_cm: privateRes.data?.height_cm ?? null,
    secondaryPositionIds: (secposRes.data ?? []).map((r) => r.position_id),
  };
}

/** Fetches the current user's full profile. */
export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  });
}

/** Suspense variant of useProfile; use only in protected routes where the session is guaranteed. */
export function useProfileSuspense() {
  const { user } = useAuth();
  return useSuspenseQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user?.id as string),
  });
}

/** Input for useUpdateProfile: public fields, private fields and secondary positions. */
export interface UpdateProfileInput {
  public: ProfileUpdate;
  private: { birth_date: string | null; weight_kg: number | null; height_cm: number | null };
  secondaryPositionIds: number[];
}

/** Updates the current user's public and private profile fields plus secondary positions. */
export function useUpdateProfile() {
  const { user } = useAuth();
  const userId = user?.id as string;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { error: upErr } = await supabase.from('profile').update(input.public).eq('id', userId);
      if (upErr) throw upErr;

      const { error: privErr } = await supabase
        .from('profile_private')
        .upsert({ id: userId, ...input.private }, { onConflict: 'id' });
      if (privErr) throw privErr;

      const { error: delErr } = await supabase
        .from('secondary_position')
        .delete()
        .eq('profile_id', userId);
      if (delErr) throw delErr;

      if (input.secondaryPositionIds.length > 0) {
        const rows = input.secondaryPositionIds.map((position_id) => ({
          profile_id: userId,
          position_id,
        }));
        const { error: insErr } = await supabase.from('secondary_position').insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

/** Updates the current user's username. */
export function useUpdateUsername() {
  const { user } = useAuth();
  const userId = user?.id as string;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const { error } = await supabase.from('profile').update({ username }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}

/** Minimal profile fields used to identify a player. */
export interface ProfileSummary {
  id: string;
  name: string;
  photo_url: string | null;
}

/** Summary list of all profiles, used for picking players. */
export function useProfilesList() {
  return useQuery({
    queryKey: ['profiles_list'],
    queryFn: async (): Promise<ProfileSummary[]> => {
      const { data, error } = await supabase
        .from('profile')
        .select('id, name, photo_url')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

/** Public (non-sensitive) fields of any player's profile. */
export interface PublicProfile {
  id: string;
  name: string;
  photo_url: string | null;
  locality: string | null;
  preferred_foot: PreferredFoot | null;
  featured_achievement_id: number | null;
  main_position: { code: string; label: string; category: PositionCategory } | null;
}

/** Fetches the public profile of any player. */
export function usePublicProfile(playerId: string | undefined) {
  return useQuery({
    queryKey: ['public_profile', playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<PublicProfile> => {
      const { data, error } = await supabase
        .from('profile')
        .select(
          'id, name, photo_url, locality, preferred_foot, featured_achievement_id, main_position:main_position_id(code, label, category)',
        )
        .eq('id', playerId as string)
        .single();
      if (error) throw error;
      return data as unknown as PublicProfile;
    },
  });
}

async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await supabase.from('position').select('*').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

/** Fetches the full list of positions (stable lookup table). */
export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: Infinity,
  });
}
