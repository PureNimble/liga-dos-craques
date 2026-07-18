/**
 * Tipos da base de dados.
 *
 * Idealmente gerado por `npm run db:types` (requer `supabase start` local).
 * Enquanto não há BD local, é mantido à mão em sincronia com as migrações.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Gender = 'male' | 'female' | 'other' | 'prefer_not';
export type PreferredFoot = 'left' | 'right' | 'both';
export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'FWD';
export type UserRole = 'player' | 'admin';

export type GameStatus =
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'teams_generated'
  | 'in_progress'
  | 'finished'
  | 'voting_open'
  | 'closed'
  | 'cancelled';

export type GamePlayerStatus = 'invited' | 'confirmed' | 'played' | 'no_show';
export type Team = 'A' | 'B';
export type VoteCategory = 'mvp' | 'flop';
export type ChallengeScoring = 'higher_better' | 'lower_better' | 'versus';
export type ChallengeResult = 'win' | 'loss' | 'draw' | 'na';
export type ChallengeSessionStatus = 'setup' | 'active' | 'finished';
export type CrossbarPhase = 'play' | 'sudden_death';
export type CrossbarTurnStatus = 'active' | 'sudden_death' | 'finished';
export type PenaltyMode = 'pen_goals' | 'pen_zones' | 'pen_target';
export type SessionMode = 'crossbar' | PenaltyMode;

export interface Database {
  public: {
    Tables: {
      health: {
        Row: { id: number; checked_at: string; note: string | null };
        Insert: { id?: number; checked_at?: string; note?: string | null };
        Update: { id?: number; checked_at?: string; note?: string | null };
        Relationships: [];
      };
      position: {
        Row: {
          id: number;
          code: string;
          label: string;
          category: PositionCategory;
          sort_order: number;
        };
        Insert: {
          id?: number;
          code: string;
          label: string;
          category: PositionCategory;
          sort_order?: number;
        };
        Update: {
          id?: number;
          code?: string;
          label?: string;
          category?: PositionCategory;
          sort_order?: number;
        };
        Relationships: [];
      };
      profile: {
        Row: {
          id: string;
          name: string;
          photo_url: string | null;
          gender: Gender | null;
          locality: string | null;
          preferred_foot: PreferredFoot | null;
          main_position_id: number | null;
          featured_achievement_id: number | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          photo_url?: string | null;
          gender?: Gender | null;
          locality?: string | null;
          preferred_foot?: PreferredFoot | null;
          main_position_id?: number | null;
        };
        // O cliente só pode atualizar estas colunas (GRANTs por coluna).
        Update: {
          name?: string;
          photo_url?: string | null;
          gender?: Gender | null;
          locality?: string | null;
          preferred_foot?: PreferredFoot | null;
          main_position_id?: number | null;
          featured_achievement_id?: number | null;
        };
        Relationships: [];
      };
      profile_private: {
        Row: {
          id: string;
          birth_date: string | null;
          weight_kg: number | null;
          height_cm: number | null;
        };
        Insert: {
          id: string;
          birth_date?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
        };
        Update: {
          birth_date?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
        };
        Relationships: [];
      };
      secondary_position: {
        Row: { profile_id: string; position_id: number };
        Insert: { profile_id: string; position_id: number };
        Update: { profile_id?: string; position_id?: number };
        Relationships: [];
      };
      game_format: {
        Row: {
          id: number;
          code: string;
          label: string;
          players_per_side: number;
          sort_order: number;
        };
        Insert: {
          id?: number;
          code: string;
          label: string;
          players_per_side: number;
          sort_order?: number;
        };
        Update: {
          id?: number;
          code?: string;
          label?: string;
          players_per_side?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      game: {
        Row: {
          id: string;
          created_by: string;
          scheduled_at: string;
          location: string | null;
          format_id: number;
          max_players: number;
          status: GameStatus;
          team_a_score: number | null;
          team_b_score: number | null;
          voting_closes_at: string | null;
          started_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          scheduled_at: string;
          location?: string | null;
          format_id: number;
          max_players: number;
          status?: GameStatus;
          notes?: string | null;
        };
        Update: {
          scheduled_at?: string;
          location?: string | null;
          format_id?: number;
          max_players?: number;
          status?: GameStatus;
          team_a_score?: number | null;
          team_b_score?: number | null;
          voting_closes_at?: string | null;
          started_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      game_player: {
        Row: {
          id: string;
          game_id: string;
          player_id: string;
          status: GamePlayerStatus;
          team: Team | null;
          pos_x: number | null;
          pos_y: number | null;
          on_field: boolean;
          added_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_id: string;
          status?: GamePlayerStatus;
          team?: Team | null;
          pos_x?: number | null;
          pos_y?: number | null;
          on_field?: boolean;
        };
        Update: {
          status?: GamePlayerStatus;
          team?: Team | null;
          pos_x?: number | null;
          pos_y?: number | null;
          on_field?: boolean;
        };
        Relationships: [];
      };
      event_type: {
        Row: {
          id: number;
          code: string;
          label: string;
          supports_tags: boolean;
          affects_score: boolean;
          sort_order: number;
          active: boolean;
        };
        Insert: {
          id?: number;
          code: string;
          label: string;
          supports_tags?: boolean;
          affects_score?: boolean;
          sort_order?: number;
          active?: boolean;
        };
        Update: {
          label?: string;
          supports_tags?: boolean;
          affects_score?: boolean;
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      tag: {
        Row: {
          id: number;
          code: string;
          label: string;
          category: string | null;
          sort_order: number;
        };
        Insert: {
          id?: number;
          code: string;
          label: string;
          category?: string | null;
          sort_order?: number;
        };
        Update: {
          label?: string;
          category?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      event: {
        Row: {
          id: string;
          game_id: string;
          player_id: string;
          event_type_id: number;
          minute: number | null;
          team: Team | null;
          meta: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_id: string;
          event_type_id: number;
          minute?: number | null;
          team?: Team | null;
          meta?: Json;
          created_by: string;
        };
        Update: {
          minute?: number | null;
          team?: Team | null;
          meta?: Json;
        };
        Relationships: [];
      };
      event_tag: {
        Row: { event_id: string; tag_id: number };
        Insert: { event_id: string; tag_id: number };
        Update: { tag_id?: number };
        Relationships: [];
      };
      xp_rule: {
        Row: {
          id: number;
          code: string;
          points: number;
          valid_from: string;
          valid_to: string | null;
          active: boolean;
        };
        Insert: {
          id?: number;
          code: string;
          points: number;
          valid_from?: string;
          valid_to?: string | null;
          active?: boolean;
        };
        Update: {
          points?: number;
          valid_to?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      xp_ledger: {
        Row: {
          id: string;
          player_id: string;
          game_id: string | null;
          source_code: string;
          points: number;
          xp_rule_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          game_id?: string | null;
          source_code: string;
          points: number;
          xp_rule_id?: number | null;
        };
        Update: never;
        Relationships: [];
      };
      xp_level: {
        Row: { level: number; min_xp: number };
        Insert: { level: number; min_xp: number };
        Update: { min_xp?: number };
        Relationships: [];
      };
      achievement: {
        Row: {
          id: number;
          code: string;
          label: string;
          description: string;
          icon: string;
          criteria: Json;
          sort_order: number;
          active: boolean;
        };
        Insert: {
          id?: number;
          code: string;
          label: string;
          description: string;
          icon?: string;
          criteria: Json;
          sort_order?: number;
          active?: boolean;
        };
        Update: {
          label?: string;
          description?: string;
          icon?: string;
          criteria?: Json;
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      user_achievement: {
        Row: { player_id: string; achievement_id: number; unlocked_at: string };
        Insert: { player_id: string; achievement_id: number };
        Update: never;
        Relationships: [];
      };
      challenge: {
        Row: {
          id: number;
          code: string;
          label: string;
          scoring_type: ChallengeScoring;
          icon: string;
          sort_order: number;
          active: boolean;
        };
        Insert: {
          id?: number;
          code: string;
          label: string;
          scoring_type: ChallengeScoring;
          icon?: string;
          sort_order?: number;
          active?: boolean;
        };
        Update: {
          label?: string;
          scoring_type?: ChallengeScoring;
          icon?: string;
          sort_order?: number;
          active?: boolean;
        };
        Relationships: [];
      };
      challenge_attempt: {
        Row: {
          id: string;
          challenge_id: number;
          player_id: string;
          opponent_id: string | null;
          score: number | null;
          result: ChallengeResult;
          played_at: string;
          meta: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: number;
          player_id: string;
          opponent_id?: string | null;
          score?: number | null;
          result?: ChallengeResult;
          played_at?: string;
          meta?: Json;
          created_by: string;
        };
        Update: {
          score?: number | null;
          result?: ChallengeResult;
          played_at?: string;
          meta?: Json;
        };
        Relationships: [];
      };
      challenge_session: {
        Row: {
          id: string;
          challenge_id: number;
          mode: SessionMode;
          spot_count: number;
          status: ChallengeSessionStatus;
          current_turn_index: number;
          round: number;
          phase: CrossbarPhase;
          max_rounds: number | null;
          winner_id: string | null;
          created_by: string;
          created_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          challenge_id: number;
          mode?: SessionMode;
          spot_count: number;
          status?: ChallengeSessionStatus;
          current_turn_index?: number;
          round?: number;
          phase?: CrossbarPhase;
          max_rounds?: number | null;
          winner_id?: string | null;
          created_by: string;
          created_at?: string;
          finished_at?: string | null;
        };
        Update: {
          mode?: SessionMode;
          spot_count?: number;
          status?: ChallengeSessionStatus;
          current_turn_index?: number;
          round?: number;
          phase?: CrossbarPhase;
          max_rounds?: number | null;
          winner_id?: string | null;
          finished_at?: string | null;
        };
        Relationships: [];
      };
      session_player: {
        Row: {
          id: string;
          session_id: string;
          player_id: string;
          turn_order: number;
          current_spot: number;
          goals: number;
          zones: number;
          target: number | null;
          eliminated: boolean;
          sd_shot: boolean;
          sd_hit: boolean;
        };
        Insert: {
          id?: string;
          session_id: string;
          player_id: string;
          turn_order?: number;
          current_spot?: number;
          goals?: number;
          zones?: number;
          target?: number | null;
          eliminated?: boolean;
          sd_shot?: boolean;
          sd_hit?: boolean;
        };
        Update: {
          turn_order?: number;
          current_spot?: number;
          goals?: number;
          zones?: number;
          target?: number | null;
          eliminated?: boolean;
          sd_shot?: boolean;
          sd_hit?: boolean;
        };
        Relationships: [];
      };
      session_turn: {
        Row: {
          id: string;
          session_id: string;
          player_id: string;
          spot_index: number;
          hit: boolean;
          turn_no: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          player_id: string;
          spot_index: number;
          hit: boolean;
          turn_no: number;
          created_at?: string;
        };
        Update: {
          hit?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      v_player_stats: {
        Row: {
          player_id: string;
          name: string;
          games: number;
          wins: number;
          draws: number;
          losses: number;
          goals: number;
          assists: number;
          saves: number;
          mvps: number;
          flops: number;
          avg_rating: number | null;
        };
        Relationships: [];
      };
      v_game_player_rating: {
        Row: {
          game_id: string;
          player_id: string;
          rating: number | null;
        };
        Relationships: [];
      };
      v_game_award: {
        Row: {
          game_id: string;
          category: VoteCategory;
          player_id: string;
        };
        Relationships: [];
      };
      v_player_xp: {
        Row: {
          player_id: string;
          total_xp: number;
          level: number;
          level_min_xp: number;
          next_level_xp: number | null;
        };
        Relationships: [];
      };
      v_ranking_overall: {
        Row: {
          player_id: string;
          name: string;
          photo_url: string | null;
          position_category: PositionCategory | null;
          games: number;
          wins: number;
          draws: number;
          losses: number;
          goals: number;
          assists: number;
          saves: number;
          mvps: number;
          flops: number;
          total_xp: number;
        };
        Relationships: [];
      };
      v_ranking_by_format: {
        Row: {
          player_id: string;
          name: string;
          photo_url: string | null;
          format_code: string;
          games: number;
          wins: number;
          draws: number;
          losses: number;
          goals: number;
          assists: number;
          points: number;
        };
        Relationships: [];
      };
      v_ranking_by_period: {
        Row: {
          player_id: string;
          name: string;
          photo_url: string | null;
          year: number;
          month: number;
          games: number;
          wins: number;
          draws: number;
          losses: number;
          goals: number;
          assists: number;
          points: number;
        };
        Relationships: [];
      };
      v_ranking_annual: {
        Row: {
          player_id: string;
          name: string;
          photo_url: string | null;
          year: number;
          games: number;
          wins: number;
          draws: number;
          losses: number;
          goals: number;
          assists: number;
          points: number;
        };
        Relationships: [];
      };
      v_challenge_leaderboard: {
        Row: {
          challenge_id: number;
          challenge_code: string;
          scoring_type: ChallengeScoring;
          player_id: string;
          name: string;
          photo_url: string | null;
          attempts: number;
          best_high: number | null;
          best_low: number | null;
          wins: number;
          losses: number;
          last_played: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      ping: { Args: Record<string, never>; Returns: string };
      resolve_awards: { Args: { p_game_id: string }; Returns: string };
      backfill_progression: {
        Args: Record<string, never>;
        Returns: { games_awarded: number; players_evaluated: number }[];
      };
      set_xp_rule: { Args: { p_code: string; p_points: number }; Returns: undefined };
      admin_set_password: { Args: { p_user_id: string; p_password: string }; Returns: undefined };
      crossbar_start_session: { Args: { p_session_id: string }; Returns: undefined };
      crossbar_record_turn: {
        Args: { p_session_id: string; p_hit: boolean };
        Returns: { status: CrossbarTurnStatus; winner_id: string | null };
      };
      crossbar_create_and_start: {
        Args: {
          p_challenge_id: number;
          p_spot_count: number;
          p_player_ids: string[];
          p_max_rounds?: number | null;
        };
        Returns: string;
      };
      penalty_create_and_start: {
        Args: {
          p_challenge_id: number;
          p_mode: PenaltyMode;
          p_player_ids: string[];
          p_rounds?: number | null;
        };
        Returns: string;
      };
      penalty_record_turn: {
        Args: { p_session_id: string; p_hit: boolean; p_zone?: number | null };
        Returns: { status: CrossbarTurnStatus; winner_id: string | null };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
