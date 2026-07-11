/**
 * Tipos da base de dados.
 *
 * PLACEHOLDER — este ficheiro é gerado automaticamente a partir do schema Supabase.
 * Regenerar com:  npm run db:types   (requer `supabase start` local ou --project-id)
 *
 * Na F0 contém apenas a tabela `health` usada para provar a ligação e o keep-alive.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      health: {
        Row: {
          id: number;
          checked_at: string;
          note: string | null;
        };
        Insert: {
          id?: number;
          checked_at?: string;
          note?: string | null;
        };
        Update: {
          id?: number;
          checked_at?: string;
          note?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ping: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
