import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database } from '@/types/database';

/** Row of the bug_report table. */
export type BugReport = Database['public']['Tables']['bug_report']['Row'];

/** A bug report joined with its reporter's basic profile info. */
export interface BugReportWithReporter extends BugReport {
  reporter: { name: string; photo_url: string | null } | null;
}

/** Creates a bug report on behalf of the current user. */
export function useSubmitBugReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { message: string; page: string | null }) => {
      if (!user) throw new Error('Sem sessão');
      const { error } = await supabase.from('bug_report').insert({
        reporter_id: user.id,
        message: input.message,
        page: input.page,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bug_reports'] }),
  });
}

/** Admin: all bug reports, unresolved first. */
export function useBugReports() {
  return useQuery({
    queryKey: ['bug_reports'],
    queryFn: async (): Promise<BugReportWithReporter[]> => {
      const { data, error } = await supabase
        .from('bug_report')
        .select('*, reporter:reporter_id(name, photo_url)')
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BugReportWithReporter[];
    },
  });
}

/** Count of unresolved bug reports, for the dashboard. */
export function useOpenBugReportCount() {
  return useQuery({
    queryKey: ['bug_reports_open_count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('bug_report')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

/** Admin: toggles a bug report's status (resolved / unresolved). */
export function useResolveBugReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; resolved: boolean }) => {
      const { error } = await supabase
        .from('bug_report')
        .update({
          status: input.resolved ? 'resolved' : 'open',
          resolved_at: input.resolved ? new Date().toISOString() : null,
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug_reports'] });
      queryClient.invalidateQueries({ queryKey: ['bug_reports_open_count'] });
    },
  });
}
