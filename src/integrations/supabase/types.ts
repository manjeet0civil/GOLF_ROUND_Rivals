export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blood_requests: {
        Row: {
          additional_notes: string | null
          blood_group: string
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          hospital_name: string | null
          id: string
          location: string
          required_date: string | null
          status: string | null
          updated_at: string | null
          urgency_level: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          blood_group: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          hospital_name?: string | null
          id?: string
          location: string
          required_date?: string | null
          status?: string | null
          updated_at?: string | null
          urgency_level: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          blood_group?: string
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          hospital_name?: string | null
          id?: string
          location?: string
          required_date?: string | null
          status?: string | null
          updated_at?: string | null
          urgency_level?: string
          user_id?: string
        }
        Relationships: []
      }
      donors: {
        Row: {
          address: string | null
          availability_status: boolean | null
          available_for_emergency: boolean | null
          blood_group: string
          city: string | null
          created_at: string | null
          emergency_contact: string | null
          id: string
          last_donation_date: string | null
          location_lat: number | null
          location_lng: number | null
          medical_conditions: string | null
          name: string
          phone: string
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          availability_status?: boolean | null
          available_for_emergency?: boolean | null
          blood_group: string
          city?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          id?: string
          last_donation_date?: string | null
          location_lat?: number | null
          location_lng?: number | null
          medical_conditions?: string | null
          name: string
          phone: string
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          availability_status?: boolean | null
          available_for_emergency?: boolean | null
          blood_group?: string
          city?: string | null
          created_at?: string | null
          emergency_contact?: string | null
          id?: string
          last_donation_date?: string | null
          location_lat?: number | null
          location_lng?: number | null
          medical_conditions?: string | null
          name?: string
          phone?: string
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_players: {
        Row: {
          game_id: string
          handicap: number | null
          id: string
          is_host: boolean | null
          joined_at: string
          player_name: string
          user_id: string
        }
        Insert: {
          game_id: string
          handicap?: number | null
          id?: string
          is_host?: boolean | null
          joined_at?: string
          player_name: string
          user_id: string
        }
        Update: {
          game_id?: string
          handicap?: number | null
          id?: string
          is_host?: boolean | null
          joined_at?: string
          player_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          completed_at: string | null
          course_name: string
          created_at: string
          game_code: string
          host_user_id: string
          id: string
          max_players: number | null
          number_of_holes: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          course_name: string
          created_at?: string
          game_code: string
          host_user_id: string
          id?: string
          max_players?: number | null
          number_of_holes?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          course_name?: string
          created_at?: string
          game_code?: string
          host_user_id?: string
          id?: string
          max_players?: number | null
          number_of_holes?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scores: {
        Row: {
          created_at: string
          game_id: string
          hole_number: number
          id: string
          par: number
          strokes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          hole_number: number
          id?: string
          par?: number
          strokes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          hole_number?: number
          id?: string
          par?: number
          strokes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_game_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
