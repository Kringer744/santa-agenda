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
          observacoes: string | null
          meses_retorno: number | null
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
          observacoes?: string | null
          meses_retorno?: number | null
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
          observacoes?: string | null
          meses_retorno?: number | null
        }
        Relationships: []
      }
      dentistas: {
        Row: {
          id: string
          nome: string
          cro: string
          especialidade: string | null
          telefone: string | null
          email: string | null
          created_at: string
          updated_at: string
          google_calendar_id: string | null
          procedimentos: string[]
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
          google_calendar_id?: string | null
          procedimentos?: string[]
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
          google_calendar_id?: string | null
          procedimentos?: string[]
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
      clinics: {
        Row: {
          id: string
          name: string
          chatwoot_base_url: string | null
          chatwoot_account_id: number | null
          chatwoot_api_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          chatwoot_base_url?: string | null
          chatwoot_account_id?: number | null
          chatwoot_api_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          chatwoot_base_url?: string | null
          chatwoot_account_id?: number | null
          chatwoot_api_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          clinic_id: string
          chatwoot_conversation_id: number | null
          patient_id: string | null
          status: string | null
          priority: string | null
          assigned_user_id: string | null
          last_message: string | null
          last_message_at: string | null
          channel: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          chatwoot_conversation_id?: number | null
          patient_id?: string | null
          status?: string | null
          priority?: string | null
          assigned_user_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          channel?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          chatwoot_conversation_id?: number | null
          patient_id?: string | null
          status?: string | null
          priority?: string | null
          assigned_user_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          channel?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          clinic_id: string
          conversation_id: string
          chatwoot_message_id: number | null
          direction: string
          content: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          conversation_id: string
          chatwoot_message_id?: number | null
          direction: string
          content?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          conversation_id?: string
          chatwoot_message_id?: number | null
          direction?: string
          content?: string | null
          status?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
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
          urgencia: boolean
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
          urgencia?: boolean
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
          urgencia?: boolean
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
          google_event_id: string | null
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
          google_event_id?: string | null
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
          google_event_id?: string | null
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
          footer_text: string | null
          list_button_text: string | null
          parabens_automatico: boolean | null
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
          footer_text?: string | null
          list_button_text?: string | null
          parabens_automatico?: boolean | null
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
          footer_text?: string | null
          list_button_text?: string | null
          parabens_automatico?: boolean | null
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