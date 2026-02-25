export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  observacoes: string | null;
  meses_retorno: number | null;
}

export interface Dentista {
  id: string;
  nome: string;
  cro: string;
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
  google_calendar_id: string | null;
  procedimentos: string[]; // IDs dos procedimentos vinculados
  created_at: string;
  updated_at: string;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  dentista_id: string;
  clinica_id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  procedimentos: string[];
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'reagendada';
  valor_total: number;
  codigo_consulta: string | null;
  pagamento_status: 'pendente' | 'aprovado' | 'recusado';
  urgencia: boolean;
  created_at: string;
  updated_at: string;
  pix_txid: string | null;
  pix_qr_code_base64: string | null;
  pix_copia_e_cola: string | null;
}

export interface Procedimento {
  id: string;
  nome: string;
  preco: number;
  icone: string;
  ativo: boolean;
  created_at: string;
}

export interface Clinica {
  id: string;
  nome: string;
  capacidade_atendimentos: number;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgendaDentista {
  id: string;
  data: string;
  dentista_id: string;
  clinica_id: string;
  horarios_disponiveis: string[];
  horarios_ocupados: string[];
  google_event_id: string | null | undefined; // Alterado para incluir 'undefined'
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMenuOption {
  id: string;
  texto: string;
  resposta: string;
  ativo: boolean;
}

export interface WhatsAppMenuConfig {
  id?: string;
  api_url: string;
  instance_token: string;
  mensagem_boas_vindas: string;
  menu_ativo: boolean;
  opcoes_menu: WhatsAppMenuOption[];
  footer_text: string | null;
  list_button_text: string | null;
  parabens_automatico: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}