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
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
  is_menor_idade: boolean;
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
  google_event_id: string | null | undefined;
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

export interface IAConfig {
  id?: string;
  ativo: boolean;
  provider: string;
  api_key: string;
  modelo_principal: string;
  modelo_lite: string;
  nome_clinica: string;
  personalidade: string;
  instrucoes_adicionais: string;
  horario_funcionamento: Record<string, { inicio: string; fim: string } | null>;
  endereco: string;
  max_tokens_resposta: number;
  temperatura: number;
  created_at?: string;
  updated_at?: string;
}

export interface WhatsAppTemplate {
  id: string;
  tipo: string;
  nome: string;
  mensagem: string;
  ativo: boolean;
  delay_horas: number;
  created_at?: string;
  updated_at?: string;
}

export interface IALog {
  id: string;
  telefone: string;
  mensagem_recebida: string;
  resposta_ia: string;
  intencao: string;
  modelo_usado: string;
  tokens_entrada: number;
  tokens_saida: number;
  tempo_resposta_ms: number;
  created_at: string;
}

export interface LembreteAgendado {
  id: string;
  consulta_id: string | null;
  paciente_id: string | null;
  template_id: string | null;
  telefone: string;
  mensagem: string;
  agendado_para: string;
  status: 'pendente' | 'enviado' | 'erro' | 'cancelado';
  tentativas: number;
  erro_msg: string | null;
  created_at: string;
  enviado_at: string | null;
}