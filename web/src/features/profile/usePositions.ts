import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

export type Position = Database['public']['Tables']['position']['Row'];

async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await supabase.from('position').select('*').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: fetchPositions,
    staleTime: Infinity, // lookup estável
  });
}
