export interface Tutor {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
  data_nascimento: string | null;
  created_at: string;
  updated_at: string; // Added updated_at to match Supabase type
  tags: string[];
}

export interface Pet {
  id: string;
  tutor_id: string;
  nome: string;
  especie: 'cachorro' | 'gato';
  raca: string | null;
  porte: 'pequeno' | 'medio' | 'grande' | null;
  idade: number | null;
  data_nascimento: string | null;
  necessidades_especiais: string | null;
  observacoes_comportamentais: string | null;
  created_at: string;
  updated_at: string; // Added updated_at to match Supabase type
}

export interface Reserva {
  id: string;
  tutor_id: string;
  pet_id: string;
  unidade_id: string;
  check_in: string;
  check_out: string;
  servicos_adicionais: string[]; // Changed to string[] to store service IDs
  status: 'pendente' | 'confirmada' | 'checkin' | 'hospedado' | 'checkout' | 'finalizada' | 'cancelada';
  valor_total: number;
  codigo_estadia: string | null;
  pagamento_status: 'pendente' | 'aprovado' | 'recusado';
  created_at: string;
  updated_at: string; // Added updated_at to match Supabase type
}

export interface ServicoAdicional {
  id: string;
  nome: string;
  preco: number;
  icone: string;
  ativo: boolean; // Added ativo to match Supabase type
  created_at: string; // Added created_at to match Supabase type
}

export interface Unidade {
  id: string;
  nome: string;
  capacidade_cachorro: number;
  capacidade_gato: number;
  endereco: string | null; // Changed to string | null to match Supabase type
  created_at: string; // Added created_at to match Supabase type
  updated_at: string; // Added updated_at to match Supabase type
}

export interface VagaDia {
  id: string; // Added id to match Supabase type
  data: string;
  unidade_id: string;
  vagas_cachorro_total: number;
  vagas_cachorro_ocupadas: number;
  vagas_gato_total: number;
  vagas_gato_ocupadas: number;
}

export interface MensagemAgendada {
  id: string;
  tipo: 'pre-estadia' | 'durante' | 'pos-estadia' | 'aniversario';
  reserva_id?: string; // Changed to snake_case
  pet_id: string; // Changed to snake_case
  tutor_id: string; // Changed to snake_case
  data_envio: string; // Changed to snake_case
  status: 'agendada' | 'enviada' | 'erro';
  mensagem: string;
}