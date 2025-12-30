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
      agenda_dentista: {
        Row: {
          id: string;
          data: string;
          dentista_id: string;
          clinica_id: string;
          horarios_disponiveis: string[] | null;
          horarios_ocupados: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          data: string;
          dentista_id: string;
          clinica_id: string;
          horarios_disponiveis?: string[] | null;
          horarios_ocupados?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          data?: string;
          dentista_id?: string;
          clinica_id?: string;
          horarios_disponiveis?: string[] | null;
          horarios_ocupados?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agenda_dentista_dentista_id_fkey"
            columns: ["dentista_id"]
            isOneToOne: false
            referencedRelation: "dentistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_dentista_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ];
      };
      clinicas: {
        Row: {
          id: string;
          nome: string;
          capacidade_atendimentos: number;
          endereco: string | null;
          cidade: string | null;
          estado: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          capacidade_atendimentos?: number;
          endereco?: string | null;
          cidade?: string | null;
          estado?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          capacidade_atendimentos?: number;
          endereco?: string | null;
          cidade?: string | null;
          estado?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consultas: {
        Row: {
          id: string;
          paciente_id: string;
          dentista_id: string;
          clinica_id: string;
          data_hora_inicio: string;
          data_hora_fim: string;
          procedimentos: string[] | null;
          status: string;
          valor_total: number;
          codigo_consulta: string | null;
          pagamento_status: string;
          created_at: string;
          updated_at: string;
          pix_txid: string | null;
          pix_qr_code_base64: string | null;
          pix_copia_e_cola: string | null;
        };
        Insert: {
          id?: string;
          paciente_id: string;
          dentista_id: string;
          clinica_id: string;
          data_hora_inicio: string;
          data_hora_fim: string;
          procedimentos?: string[] | null;
          status?: string;
          valor_total: number;
          codigo_consulta?: string | null;
          pagamento_status?: string;
          created_at?: string;
          updated_at?: string;
          pix_txid?: string | null;
          pix_qr_code_base64?: string | null;
          pix_copia_e_cola?: string | null;
        };
        Update: {
          id?: string;
          paciente_id?: string;
          dentista_id?: string;
          clinica_id?: string;
          data_hora_inicio?: string;
          data_hora_fim?: string;
          procedimentos?: string[] | null;
          status?: string;
          valor_total?: number;
          codigo_consulta?: string | null;
          pagamento_status?: string;
          created_at?: string;
          updated_at?: string;
          pix_txid?: string | null;
          pix_qr_code_base64?: string | null;
          pix_copia_e_cola?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
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
            foreignKeyName: "consultas_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id"]
          },
        ];
      };
      dentistas: {
        Row: {
          id: string;
          nome: string;
          cro: string;
          especialidade: string | null;
          telefone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cro: string;
          especialidade?: string | null;
          telefone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cro?: string;
          especialidade?: string | null;
          telefone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pacientes: {
        Row: {
          id: string;
          nome: string;
          cpf: string;
          telefone: string;
          email: string | null;
          data_nascimento: string | null;
          created_at: string;
          updated_at: string;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          nome: string;
          cpf: string;
          telefone: string;
          email?: string | null;
          data_nascimento?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          nome?: string;
          cpf?: string;
          telefone?: string;
          email?: string | null;
          data_nascimento?: string | null;
          created_at?: string;
          updated_at?: string;
          tags?: string[] | null;
        };
        Relationships: [];
      };
      procedimentos: {
        Row: {
          id: string;
          nome: string;
          preco: number;
          icone: string;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          preco: number;
          icone?: string;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          preco?: number;
          icone?: string;
          ativo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      whatsapp_campaigns: {
        Row: {
          id: string;
          nome: string;
          mensagem: string;
          delay_min: number;
          delay_max: number;
          status: string;
          total_leads: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          mensagem: string;
          delay_min: number;
          delay_max: number;
          status?: string;
          total_leads: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string;
          mensagem?: string;
          delay_min?: number;
          delay_max?: number;
          status?: string;
          total_leads?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      whatsapp_config: {
        Row: {
          api_url: string;
          created_at: string | null;
          id: string;
          instance_token: string;
          mensagem_boas_vindas: string | null;
          menu_ativo: boolean | null;
          opcoes_menu: Json | null;
          updated_at: string | null;
        };
        Insert: {
          api_url: string;
          created_at?: string | null;
          id?: string;
          instance_token: string;
          mensagem_boas_vindas?: string | null;
          menu_ativo?: boolean | null;
          opcoes_menu?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          api_url?: string;
          created_at?: string | null;
          id?: string;
          instance_token?: string;
          mensagem_boas_vindas?: string | null;
          menu_ativo?: boolean | null;
          opcoes_menu?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      whatsapp_leads: {
        Row: {
          id: string;
          nome: string | null;
          telefone: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome?: string | null;
          telefone: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string | null;
          telefone?: string;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      whatsapp_messages: {
        Row: {
          created_at: string | null;
          destinatario: string;
          id: string;
          mensagem: string;
          paciente_id: string | null;
          consulta_id: string | null;
          status: string | null;
          tipo: string;
          dentista_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          destinatario: string;
          id?: string;
          mensagem: string;
          paciente_id?: string | null;
          consulta_id?: string | null;
          status?: string | null;
          tipo: string;
          dentista_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          destinatario?: string;
          id?: string;
          mensagem?: string;
          paciente_id?: string | null;
          consulta_id?: string | null;
          status?: string | null;
          tipo?: string;
          dentista_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
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
        ];
      };
      whatsapp_templates: {
        Row: {
          ativo: boolean | null;
          created_at: string | null;
          descricao: string | null;
          id: string;
          mensagem: string;
          nome: string;
          tipo: string;
          updated_at: string | null;
        };
        Insert: {
          ativo?: boolean | null;
          created_at?: string | null;
          descricao?: string | null;
          id?: string;
          mensagem: string;
          nome: string;
          tipo: string;
          updated_at?: string | null;
        };
        Update: {
          ativo?: boolean | null;
          created_at?: string | null;
          descricao?: string | null;
          id?: string;
          mensagem?: string;
          nome?: string;
          tipo?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enviar_mensagens_agendadas: { Args: never; Returns: undefined }
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