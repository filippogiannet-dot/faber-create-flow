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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      generation_logs: {
        Row: {
          created_at: string
          details: Json | null
          execution_time_ms: number | null
          id: string
          project_id: string
          status: string
          step: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          execution_time_ms?: number | null
          id?: string
          project_id: string
          status: string
          step: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          execution_time_ms?: number | null
          id?: string
          project_id?: string
          status?: string
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          messages_limit: number | null
          messages_used: number | null
          plan: Database["public"]["Enums"]["user_plan"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          messages_limit?: number | null
          messages_used?: number | null
          plan?: Database["public"]["Enums"]["user_plan"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          messages_limit?: number | null
          messages_used?: number | null
          plan?: Database["public"]["Enums"]["user_plan"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string
          file_content: string
          file_path: string
          file_type: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_content: string
          file_path: string
          file_type: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_content?: string
          file_path?: string
          file_type?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_modifications: {
        Row: {
          created_at: string
          files_changed: Json | null
          id: string
          modification_prompt: string
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          files_changed?: Json | null
          id?: string
          modification_prompt: string
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          files_changed?: Json | null
          id?: string
          modification_prompt?: string
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_modifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          deploy_url: string | null
          description: string | null
          error_message: string | null
          generated_files: Json | null
          generation_status: string
          id: string
          libraries: string[] | null
          messages_used: number | null
          name: string
          original_prompt: string | null
          owner_id: string
          package_json: Json | null
          state: Json | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deploy_url?: string | null
          description?: string | null
          error_message?: string | null
          generated_files?: Json | null
          generation_status?: string
          id?: string
          libraries?: string[] | null
          messages_used?: number | null
          name: string
          original_prompt?: string | null
          owner_id: string
          package_json?: Json | null
          state?: Json | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deploy_url?: string | null
          description?: string | null
          error_message?: string | null
          generated_files?: Json | null
          generation_status?: string
          id?: string
          libraries?: string[] | null
          messages_used?: number | null
          name?: string
          original_prompt?: string | null
          owner_id?: string
          package_json?: Json | null
          state?: Json | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          ai_response: Json | null
          created_at: string | null
          id: string
          project_id: string
          prompt_text: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          ai_response?: Json | null
          created_at?: string | null
          id?: string
          project_id: string
          prompt_text: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          ai_response?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string
          prompt_text?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          prompt_id: string | null
          state: Json
          version: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          prompt_id?: string | null
          state: Json
          version: number
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          prompt_id?: string | null
          state?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "snapshots_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_limits: {
        Args: { user_id: string }
        Returns: boolean
      }
      increment_usage: {
        Args: { project_id?: string; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      project_status: "active" | "archived" | "deleted"
      user_plan: "free" | "pro" | "enterprise"
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
      project_status: ["active", "archived", "deleted"],
      user_plan: ["free", "pro", "enterprise"],
    },
  },
} as const
