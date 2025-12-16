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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      whatsapp_campaigns: {
        Row: {
          created_at: string
          delay_max: number | null
          delay_min: number | null
          enviados: number | null
          id: string
          mensagem: string
          nome: string
          status: string | null
          total_leads: number | null
        }
        Insert: {
          created_at?: string
          delay_max?: number | null
          delay_min?: number | null
          enviados?: number | null
          id?: string
          mensagem: string
          nome: string
          status?: string | null
          total_leads?: number | null
        }
        Update: {
          created_at?: string
          delay_max?: number | null
          delay_min?: number | null
          enviados?: number | null
          id?: string
          mensagem?: string
          nome?: string
          status?: string | null
          total_leads?: number | null
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          api_url: string
          created_at: string
          id: string
          instance_token: string
          mensagem_boas_vindas: string | null
          menu_ativo: boolean | null
          opcoes_menu: Json | null
          updated_at: string
        }
        Insert: {
          api_url: string
          created_at?: string
          id?: string
          instance_token: string
          mensagem_boas_vindas?: string | null
          menu_ativo?: boolean | null
          opcoes_menu?: Json | null
          updated_at?: string
        }
        Update: {
          api_url?: string
          created_at?: string
          id?: string
          instance_token?: string
          mensagem_boas_vindas?: string | null
          menu_ativo?: boolean | null
          opcoes_menu?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversas: {
        Row: {
          atendente_assumiu: boolean | null
          created_at: string
          id: string
          menu_enviado_at: string | null
          telefone: string
          ultima_mensagem_at: string
          updated_at: string
        }
        Insert: {
          atendente_assumiu?: boolean | null
          created_at?: string
          id?: string
          menu_enviado_at?: string | null
          telefone: string
          ultima_mensagem_at?: string
          updated_at?: string
        }
        Update: {
          atendente_assumiu?: boolean | null
          created_at?: string
          id?: string
          menu_enviado_at?: string | null
          telefone?: string
          ultima_mensagem_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          destinatario: string
          id: string
          mensagem: string
          status: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          destinatario: string
          id?: string
          mensagem: string
          status?: string | null
          tipo: string
        }
        Update: {
          created_at?: string
          destinatario?: string
          id?: string
          mensagem?: string
          status?: string | null
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
