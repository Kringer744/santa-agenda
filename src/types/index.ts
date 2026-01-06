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
  observacoes: string | null; // NOVO: Campo para observações
}

export interface Dentista {
  id: string;
  nome: string;
  cro: string; // Conselho Regional de Odontologia
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
  google_calendar_id: string | null; // NOVO: ID do Google Calendar do dentista
  created_at: string;
  updated_at: string;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  dentista_id: string;
  clinica_id: string;
  data_hora_inicio: string; // Changed from check_in
  data_hora_fim: string;    // Changed from check_out
  procedimentos: string[]; // Changed from servicos_adicionais
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada' | 'reagendada'; // Updated statuses
  valor_total: number;
  codigo_consulta: string | null; // Changed from codigo_estadia
  pagamento_status: 'pendente' | 'aprovado' | 'recusado';
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
  capacidade_atendimentos: number; // Changed from capacidade_cachorro/gato
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgendaDentista { // Changed from VagaDia
  id: string;
  data: string;
  dentista_id: string; // Link to Dentista
  clinica_id: string; // Link to Clinica
  horarios_disponiveis: string[]; // Array of time slots, e.g., ['09:00', '09:30']
  horarios_ocupados: string[]; // Array of occupied time slots
  google_event_id: string | null; // NOVO: ID do evento principal no Google Calendar para este dia
  created_at: string; // Added created_at
  updated_at: string; // Added updated_at
}

export interface MensagemClinicaAgendada { // Changed from MensagemAgendada
  id: string;
  tipo: 'lembrete_consulta' | 'pos_consulta' | 'aniversario_paciente' | 'promocao'; // Updated types
  consulta_id?: string;
  paciente_id: string;
  dentista_id?: string; // Added dentista_id
  data_envio: string;
  status: 'agendada' | 'enviada' | 'erro';
  mensagem: string;
}