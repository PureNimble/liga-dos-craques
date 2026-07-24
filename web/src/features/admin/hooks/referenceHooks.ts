import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

export type ReferenceTable = 'game_format' | 'position' | 'event_type' | 'tag';

export interface RefRow {
  id: number;
  code: string;
  label: string;
  sort_order: number;
  /** Contexto só-de-leitura dos campos estruturais (não editáveis aqui). */
  detail: string;
}

export interface RefGroup {
  table: ReferenceTable;
  title: string;
  rows: RefRow[];
}

const CATEGORY_LABELS: Record<string, string> = {
  GK: 'Guarda-redes',
  DEF: 'Defesa',
  MID: 'Médio',
  FWD: 'Avançado',
};

/** As quatro tabelas de referência, prontas para renomear/reordenar. */
export function useReferenceGroups() {
  return useQuery({
    queryKey: ['reference'],
    queryFn: async (): Promise<RefGroup[]> => {
      const [formats, positions, eventTypes, tags] = await Promise.all([
        supabase.from('game_format').select('*').order('sort_order'),
        supabase.from('position').select('*').order('sort_order'),
        supabase.from('event_type').select('*').order('sort_order'),
        supabase.from('tag').select('*').order('sort_order'),
      ]);
      for (const r of [formats, positions, eventTypes, tags]) {
        if (r.error) throw r.error;
      }
      return [
        {
          table: 'game_format',
          title: 'Formatos',
          rows: (formats.data ?? []).map((f) => ({
            id: f.id,
            code: f.code,
            label: f.label,
            sort_order: f.sort_order,
            detail: `${f.players_per_side}v${f.players_per_side}`,
          })),
        },
        {
          table: 'position',
          title: 'Posições',
          rows: (positions.data ?? []).map((p) => ({
            id: p.id,
            code: p.code,
            label: p.label,
            sort_order: p.sort_order,
            detail: CATEGORY_LABELS[p.category] ?? p.category,
          })),
        },
        {
          table: 'event_type',
          title: 'Tipos de evento',
          rows: (eventTypes.data ?? []).map((e) => ({
            id: e.id,
            code: e.code,
            label: e.label,
            sort_order: e.sort_order,
            detail: [e.affects_score ? 'conta p/ resultado' : null, e.supports_tags ? 'tags' : null]
              .filter(Boolean)
              .join(' · '),
          })),
        },
        {
          table: 'tag',
          title: 'Tags',
          rows: (tags.data ?? []).map((t) => ({
            id: t.id,
            code: t.code,
            label: t.label,
            sort_order: t.sort_order,
            detail: t.category ?? '',
          })),
        },
      ];
    },
  });
}

/** Admin: renomeia/reordena uma linha de referência (RLS: is_admin()). */
export function useUpdateReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      table: ReferenceTable;
      id: number;
      label: string;
      sort_order: number;
    }) => {
      const { error } = await supabase
        .from(input.table)
        .update({ label: input.label, sort_order: input.sort_order })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference'] });
      queryClient.invalidateQueries({ queryKey: ['game_formats'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}
