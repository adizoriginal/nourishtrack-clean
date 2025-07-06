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
      food_entries: {
        Row: {
          calories: number
          carbs: number
          created_at: string | null
          entry_date: string
          fat: number
          food_id: string
          id: string
          meal_type: string
          name: string
          protein: number
          serving_size: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string | null
          entry_date: string
          fat: number
          food_id: string
          id?: string
          meal_type: string
          name: string
          protein: number
          serving_size: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string | null
          entry_date?: string
          fat?: number
          food_id?: string
          id?: string
          meal_type?: string
          name?: string
          protein?: number
          serving_size?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_cache: {
        Row: {
          calories: number
          carbs: number
          created_at: string | null
          description: string | null
          fats: number
          id: string
          meal_type: string
          name: string
          protein: number
          source: string | null
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string | null
          description?: string | null
          fats: number
          id?: string
          meal_type: string
          name: string
          protein: number
          source?: string | null
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string | null
          description?: string | null
          fats?: number
          id?: string
          meal_type?: string
          name?: string
          protein?: number
          source?: string | null
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          description: string | null
          fats: number
          id: string
          meal_type: string
          name: string
          protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          description?: string | null
          fats: number
          id?: string
          meal_type: string
          name: string
          protein: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          description?: string | null
          fats?: number
          id?: string
          meal_type?: string
          name?: string
          protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          calorie_goal: number | null
          carbs_goal: number | null
          created_at: string | null
          dietary_preferences: string | null
          email: string | null
          fat_goal: number | null
          first_name: string | null
          gender: string | null
          height: number | null
          id: string
          last_name: string | null
          protein_goal: number | null
          updated_at: string | null
          weight: number | null
          weight_goal: string | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          calorie_goal?: number | null
          carbs_goal?: number | null
          created_at?: string | null
          dietary_preferences?: string | null
          email?: string | null
          fat_goal?: number | null
          first_name?: string | null
          gender?: string | null
          height?: number | null
          id: string
          last_name?: string | null
          protein_goal?: number | null
          updated_at?: string | null
          weight?: number | null
          weight_goal?: string | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          calorie_goal?: number | null
          carbs_goal?: number | null
          created_at?: string | null
          dietary_preferences?: string | null
          email?: string | null
          fat_goal?: number | null
          first_name?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          last_name?: string | null
          protein_goal?: number | null
          updated_at?: string | null
          weight?: number | null
          weight_goal?: string | null
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          entry_date: string
          id?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_food_entries_for_date: {
        Args: { target_date: string }
        Returns: {
          id: string
          food_id: string
          name: string
          calories: number
          protein: number
          carbs: number
          fat: number
          serving_size: string
          meal_type: string
          entry_date: string
        }[]
      }
      get_meal_plans: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_random_meals: {
        Args: { meal_type_param: string; limit_count?: number }
        Returns: {
          calories: number
          carbs: number
          created_at: string | null
          description: string | null
          fats: number
          id: string
          meal_type: string
          name: string
          protein: number
          source: string | null
        }[]
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
