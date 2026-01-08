export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      community_votes: {
        Row: {
          comparison_id: string
          created_at: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comparison_id: string
          created_at?: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comparison_id?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparison_history"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_history: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_public: boolean
          query: string
          responses: Json
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          query: string
          responses: Json
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          query?: string
          responses?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      debate_history: {
        Row: {
          created_at: string
          elapsed_time: number
          final_answer: string | null
          id: string
          is_public: boolean
          models: string[]
          query: string
          round_responses: Json
          settings: Json
          total_rounds: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          elapsed_time: number
          final_answer?: string | null
          id?: string
          is_public?: boolean
          models: string[]
          query: string
          round_responses: Json
          settings: Json
          total_rounds: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          elapsed_time?: number
          final_answer?: string | null
          id?: string
          is_public?: boolean
          models?: string[]
          query?: string
          round_responses?: Json
          settings?: Json
          total_rounds?: number
          user_id?: string | null
        }
        Relationships: []
      }
      model_performance: {
        Row: {
          created_at: string
          id: string
          model_id: string
          query_category: string | null
          response_time_ms: number
          success: boolean
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_id: string
          query_category?: string | null
          response_time_ms: number
          success?: boolean
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string
          query_category?: string | null
          response_time_ms?: number
          success?: boolean
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      response_votes: {
        Row: {
          created_at: string
          history_id: string
          history_type: string
          id: string
          model_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          history_id: string
          history_type: string
          id?: string
          model_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          history_id?: string
          history_type?: string
          id?: string
          model_id?: string
          vote_type?: string
        }
        Relationships: []
      }
      shared_results: {
        Row: {
          created_at: string
          history_id: string
          history_type: string
          id: string
          share_code: string
        }
        Insert: {
          created_at?: string
          history_id: string
          history_type: string
          id?: string
          share_code?: string
        }
        Update: {
          created_at?: string
          history_id?: string
          history_type?: string
          id?: string
          share_code?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          monthly_usage: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          updated_at: string
          usage_reset_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_usage?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          usage_reset_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_usage?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          updated_at?: string
          usage_reset_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          comparison_id: string | null
          created_at: string
          debate_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          comparison_id?: string | null
          created_at?: string
          debate_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comparison_id?: string | null
          created_at?: string
          debate_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparison_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_debate_id_fkey"
            columns: ["debate_id"]
            isOneToOne: false
            referencedRelation: "debate_history"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_plan: "free" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      subscription_plan: ["free", "pro"],
    },
  },
} as const
