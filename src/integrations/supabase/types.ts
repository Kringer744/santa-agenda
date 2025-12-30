import {
  Paciente,
  Dentista,
  Clinica,
  Consulta,
  Procedimento,
  AgendaDentista,
} from '@/types';

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
      agenda_dentista: {
        Row: AgendaDentista
        Insert: Omit<AgendaDentista, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AgendaDentista, 'id' | 'created_at' | 'updated_at'>>
        Relationships: [
          {
            foreignKeyName: "agenda_dentista_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_dentista_dentista_id_fkey"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicas: {
        Row: Clinica
        Insert: Omit<Clinica, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Clinica, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      consultas: {
        Row: Consulta
        Insert: Omit<Consulta, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Consulta, 'id' | 'created_at' | 'updated_at'>>
        Relationships: [
          {
            foreignKeyName: "consultas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_dentista_id_fkey"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      dentistas: {
        Row: Dentista
        Insert: Omit<Dentista, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Dentista, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      itau_integrations: {
        Row: {
          api_url: string
          ativo: boolean | null
          auth_url: string
          client_id: string
          client_secret_encrypted: string
          created_at: string | null
          id: string
          pix_chave: string
          user_id: string
        }
        Insert: {
          api_url?: string
          ativo?: boolean | null
          auth_url?: string
          client_id: string
          client_secret_encrypted: string
          created_at?: string | null
          id?: string
          pix_chave: string
          user_id: string
        }
        Update: {
          api_url?: string
          ativo?: boolean | null
          auth_url?: string
          client_id?: string
          client_secret_encrypted?: string
          created_at?: string | null
          id?: string
          pix_chave?: string
          user_id?: string
        }
        Relationships: []
      }
      itau_settings: {
        Row: {
          client_id: string | null
          client_secret: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pacientes: {
        Row: Paciente
        Insert: Omit<Paciente, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Paciente, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      procedimentos: {
        Row: Procedimento
        Insert: Omit<Procedimento, 'id' | 'created_at'>
        Update: Partial<Omit<Procedimento, 'id' | 'created_at'>>
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          created_at: string | null
          delay_max: number
          delay_min: number
          id: string
          mensagem: string
          nome: string
          status: string
          total_leads: number
        }
        Insert: {
          created_at?: string | null
          delay_max: number
          delay_min: number
          id?: string
          mensagem: string
          nome: string
          status: string
          total_leads: number
        }
        Update: {
          created_at?: string | null
          delay_max?: number
          delay_min?: number
          id?: string
          mensagem?: string
          nome?: string
          status?: string
          total_leads?: number
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          api_url: string
          created_at: string | null
          id: string
          instance_token: string
          mensagem_boas_vindas: string | null
          menu_ativo: boolean | null
          opcoes_menu: Json | null
          updated_at: string | null
        }
        Insert: {
          api_url: string
          created_at?: string | null
          id?: string
          instance_token: string
          mensagem_boas_vindas?: string | null
          menu_ativo?: boolean | null
          opcoes_menu?: Json | null
          updated_at?: string | null
        }
        Update: {
          api_url?: string
          created_at?: string | null
          id?: string
          instance_token?: string
          mensagem_boas_vindas?: string | null
          menu_ativo?: boolean | null
          opcoes_menu?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_conversas: {
        Row: {
          atendente_assumiu: boolean | null
          created_at: string | null
          id: string
          menu_enviado_at: string | null
          telefone: string
          ultima_mensagem_at: string | null
          updated_at: string | null
        }
        Insert: {
          atendente_assumiu?: boolean | null
          created_at?: string | null
          id?: string
          menu_enviado_at?: string | null
          telefone: string
          ultima_mensagem_at?: string | null
          updated_at?: string | null
        }
        Update: {
          atendente_assumiu?: boolean | null
          created_at?: string | null
          id?: string
          menu_enviado_at?: string | null
          telefone?: string
          ultima_mensagem_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_leads: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          consulta_id: string | null
          created_at: string | null
          dentista_id: string | null
          destinatario: string
          id: string
          mensagem: string
          paciente_id: string | null
          status: string | null
          tipo: string
        }
        Insert: {
          consulta_id?: string | null
          created_at?: string | null
          dentista_id?: string | null
          destinatario: string
          id?: string
          mensagem: string
          paciente_id?: string | null
          status?: string | null
          tipo: string
        }
        Update: {
          consulta_id?: string | null
          created_at?: string | null
          dentista_id?: string | null
          destinatario?: string
          id?: string
          mensagem?: string
          paciente_id?: string | null
          status?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_consulta_id_fkey"
            columns: ["consulta_id"]
            isOneToOne: false
            referencedRelation: "consultas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_dentista_id_fkey"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          mensagem: string
          nome: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          mensagem: string
          nome: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          mensagem?: string
          nome?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enviar_mensagens_agendadas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never