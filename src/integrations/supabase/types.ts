export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pacientes: {
        Row: {
          id: string
          nome: string
          cpf: string
          telefone: string
          email: string | null
          data_nascimento: string | null
          created_at: string
          updated_at: string
          tags: string[]
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          telefone: string
          email?: string | null
          data_nascimento?: string | null
          created_at?: string
          updated_at?: string
          tags?: string[]
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          telefone?: string
          email?: string | null
          data_nascimento?: string | null
          created_at?: string
          updated_at?: string
          tags?: string[]
        }
        Relationships: []
      }
      public_dentistas: {
        Row: {
          id: string
          nome: string
          cro: string
          especialidade: string | null
          telefone: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cro: string
          especialidade?: string | null
          telefone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cro?: string
          especialidade?: string | null
          telefone?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinicas: {
        Row: {
          id: string
          nome: string
          capacidade_atendimentos: number
          endereco: string | null
          cidade: string | null
          estado: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          capacidade_atendimentos?: number
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          capacidade_atendimentos?: number
          endereco?: string | null
          cidade?: string | null
          estado?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultas: {
        Row: {
          id: string
          paciente_id: string
          dentista_id: string
          clinica_id: string
          data_hora_inicio: string
          data_hora_fim: string
          procedimentos: string[]
          status: string
          valor_total: number
          codigo_consulta: string | null
          pagamento_status: string
          created_at: string
          updated_at: string
          pix_txid: string | null
          pix_qr_code_base64: string | null
          pix_copia_e_cola: string | null
        }
        Insert: {
          id?: string
          paciente_id: string
          dentista_id: string
          clinica_id: string
          data_hora_inicio: string
          data_hora_fim: string
          procedimentos?: string[]
          status?: string
          valor_total?: number
          codigo_consulta?: string | null
          pagamento_status?: string
          created_at?: string
          updated_at?: string
          pix_txid?: string | null
          pix_qr_code_base64?: string | null
          pix_copia_e_cola?: string | null
        }
        Update: {
          id?: string
          paciente_id?: string
          dentista_id?: string
          clinica_id?: string
          data_hora_inicio?: string
          data_hora_fim?: string
          procedimentos?: string[]
          status?: string
          valor_total?: number
          codigo_consulta?: string | null
          pagamento_status?: string
          created_at?: string
          updated_at?: string
          pix_txid?: string | null
          pix_qr_code_base64?: string | null
          pix_copia_e_cola?: string | null
        }
        Relationships: []
      }
      procedimentos: {
        Row: {
          id: string
          nome: string
          preco: number
          icone: string
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          preco: number
          icone?: string
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          preco?: number
          icone?: string
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      agenda_dentista: {
        Row: {
          id: string
          data: string
          dentista_id: string
          clinica_id: string
          horarios_disponiveis: string[]
          horarios_ocupados: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          data: string
          dentista_id: string
          clinica_id: string
          horarios_disponiveis: string[]
          horarios_ocupados: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          data?: string
          dentista_id?: string
          clinica_id?: string
          horarios_disponiveis?: string[]
          horarios_ocupados?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          id: string
          api_url: string
          instance_token: string
          mensagem_boas_vindas: string | null
          menu_ativo: boolean | null
          opcoes_menu: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          api_url: string
          instance_token: string
          mensagem_boas_vindas?: string | null
          menu_ativo?: boolean | null
          opcoes_menu?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          api_url?: string
          instance_token?: string
          mensagem_boas_vindas?: string | null
          menu_ativo?: boolean | null
          opcoes_menu?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          tipo: string
          mensagem: string
          ativo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          tipo: string
          mensagem: string
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          tipo?: string
          mensagem?: string
          ativo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          id: string
          tipo: string
          destinatario: string
          mensagem: string
          status: string | null
          consulta_id: string | null
          paciente_id: string | null
          dentista_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tipo: string
          destinatario: string
          mensagem: string
          status?: string | null
          consulta_id?: string | null
          paciente_id?: string | null
          dentista_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tipo?: string
          destinatario?: string
          mensagem?: string
          status?: string | null
          consulta_id?: string | null
          paciente_id?: string | null
          dentista_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      whatsapp_leads: {
        Row: {
          id: string
          nome: string
          telefone: string
          email: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          telefone: string
          email?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string
          email?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          id: string
          nome: string
          mensagem: string
          delay_min: number
          delay_max: number
          status: string
          total_leads: number
          created_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          mensagem: string
          delay_min: number
          delay_max: number
          status: string
          total_leads: number
          created_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          mensagem?: string
          delay_min?: number
          delay_max?: number
          status?: string
          total_leads?: number
          created_at?: string | null
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