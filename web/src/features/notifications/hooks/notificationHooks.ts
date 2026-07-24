import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

/** Row type for `notification`. */
export type Notification = Database['public']['Tables']['notification']['Row'];

/** Lists the current player's notifications, newest first. */
export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notification')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Counts unread notifications, for the nav drawer indicator. */
export function useUnreadNotificationCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['notifications_unread', userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('notification')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Marks notifications as read — all of them, or only the given ids. */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids?: number[]) => {
      const update = supabase.from('notification').update({ read_at: new Date().toISOString() });
      const { error } = ids?.length ? await update.in('id', ids) : await update.is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications_unread'] });
    },
  });
}
