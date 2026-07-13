import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import type { Database } from '@/types/database';

export type Profile = Database['public']['Tables']['profile']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profile']['Update'];
export type ProfilePrivate = Database['public']['Tables']['profile_private']['Row'];

/** Perfil do próprio: campos públicos + privados (só o dono os lê) + secundárias. */
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

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId as string),
    enabled: Boolean(userId),
  });
}

export interface UpdateProfileInput {
  public: ProfileUpdate;
  private: { birth_date: string | null; weight_kg: number | null; height_cm: number | null };
  secondaryPositionIds: number[];
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const userId = user?.id as string;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      // 1. Campos públicos.
      const { error: upErr } = await supabase.from('profile').update(input.public).eq('id', userId);
      if (upErr) throw upErr;

      // 2. Campos sensíveis (upsert na tabela privada).
      const { error: privErr } = await supabase
        .from('profile_private')
        .upsert({ id: userId, ...input.private }, { onConflict: 'id' });
      if (privErr) throw privErr;

      // 3. Posições secundárias (substituição total).
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
