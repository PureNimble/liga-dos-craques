import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database, District } from '@/types/database';

/** Row type for a place (game field). */
export type Place = Database['public']['Tables']['place']['Row'];
/** Input to create a place; `created_by` is set server-side. */
export type CreatePlaceInput = Omit<Database['public']['Tables']['place']['Insert'], 'created_by'>;

/** Fetches all places, ordered by name. */
export function usePlaces() {
  return useQuery({
    queryKey: ['places'],
    queryFn: async (): Promise<Place[]> => {
      const { data, error } = await supabase.from('place').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Searches places by name, used for location autocomplete when creating a game. */
export function useSearchPlaces(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['places', 'search', trimmed],
    queryFn: async (): Promise<Place[]> => {
      const { data, error } = await supabase
        .from('place')
        .select('*')
        .ilike('name', `%${trimmed}%`)
        .order('name')
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
    enabled: trimmed.length >= 2,
  });
}

/** Fetches places within a district, shown as individual pins on the map. */
export function usePlacesInDistrict(district: string | null) {
  return useQuery({
    queryKey: ['places', 'in-district', district],
    queryFn: async (): Promise<Place[]> => {
      const { data, error } = await supabase
        .from('place')
        .select('*')
        .eq('district', district as District)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: district !== null,
  });
}

/** Creates a place owned by the current user. */
export function useCreatePlace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePlaceInput): Promise<Place> => {
      const { data, error } = await supabase
        .from('place')
        .insert({ ...input, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['places'] }),
  });
}
