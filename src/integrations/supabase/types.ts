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
      itau_settings: {
        Row: {
          id: string;
          created_at: string;
          client_id: string | null;
          client_secret: string | null;
          pix_chave: string | null;
          api_key: string | null;
          api_url: string | null;
          auth_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          client_id?: string | null;
          client_secret?: string | null;
          pix_chave?: string | null;
          api_key?: string | null;
          api_url?: string | null;
          auth_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          client_id?: string | null;
          client_secret?: string | null;
          pix_chave?: string | null;
          api_key?: string | null;
          api_url?: string | null;
          auth_url?: string | null;
        };
        Relationships: [];
      };
      pets: {
        Row: {
          created_at: string
          data_nascimento: string | null
          especie: string
          id: string
          idade: number | null
          necessidades_especiais: string | null
          nome: string
          observacoes_comportamentais: string | null
          porte: string | null
          raca: string | null
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          especie: string
          id?: string
          idade?: number | null
          necessidades_especiais?: string | null
          nome: string
          observacoes_comportamentais?: string | null
          porte?: string | null
          raca?: string | null
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          especie?: string
          id?: string
          idade?: number | null
          necessidades_especiais?: string | null
          nome?: string
          observacoes_comportamentais?: string | null
          porte?: string | null
          raca?: string | null
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          check_in: string
          check_out: string
          codigo_estadia: string | null
          created_at: string
          id: string
          pagamento_status: string | null
          pet_id: string
          pix_copia_e_cola: string | null
          pix_qr_code_base64: string | null
          pix_txid: string | null
          servicos_adicionais: string[] | null
          status: string
          tutor_id: string
          unidade_id: string
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          check_in: string
          check_out: string
          codigo_estadia?: string | null
          created_at?: string
          id?: string
          pagamento_status?: string | null
          pet_id: string
          pix_copia_e_cola?: string | null
          pix_qr_code_base64?: string | null
          pix_txid?: string | null
          servicos_adicionais?: string[] | null
          status?: string
          tutor_id: string
          unidade_id: string
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          check_in?: string
          check_out?: string
          codigo_estadia?: string | null
          created_at?: string
          id?: string
          pagamento_status?: string | null
          pet_id?: string
          pix_copia_e_cola?: string | null
          pix_qr_code_base64?: string | null
          pix_txid?: string | null
          servicos_adicionais?: string[] | null
          status?: string
          tutor_id?: string
          unidade_id?: string
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_adicionais: {
        Row: {
          ativo: boolean | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          preco: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          preco?: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          preco?: number
        }
        Relationships: []
      }
      tutores: {
        Row: {
          cpf: string
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string
          tags: string[] | null
          telefone: string
          updated_at: string
        }
        Insert: {
          cpf: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome: string
          tags?: string[] | null
          telefone: string
          updated_at?: string
        }
        Update: {
          cpf?: string
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string
          tags?: string[] | null
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      unidades: {
        Row: {
          capacidade_cachorro: number
          capacidade_gato: number
          cidade: string | null
          created_at: string
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          capacidade_cachorro?: number
          capacidade_gato?: number
          cidade?: string | null
          created_at?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          capacidade_cachorro?: number
          capacidade_gato?: number
          cidade?: string | null
          created_at?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      vagas_dia: {
        Row: {
          data: string
          id: string
          unidade_id: string
          vagas_cachorro_ocupadas: number
          vagas_cachorro_total: number
          vagas_gato_ocupadas: number
          vagas_gato_total: number
        }
        Insert: {
          data: string
          id?: string
          unidade_id: string
          vagas_cachorro_ocupadas?: number
          vagas_cachorro_total?: number
          vagas_gato_ocupadas?: number
          vagas_gato_total?: number
        }
        Update: {
          data?: string
          id?: string
          unidade_id?: string
          vagas_cachorro_ocupadas?: number
          vagas_cachorro_total?: number
          vagas_gato_ocupadas?: number
          vagas_gato_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "vagas_dia_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
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