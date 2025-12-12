export interface Tutor {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  createdAt: string;
  tags: string[];
}

export interface Pet {
  id: string;
  tutorId: string;
  nome: string;
  especie: 'cachorro' | 'gato';
  raca: string;
  porte: 'pequeno' | 'medio' | 'grande';
  idade: number;
  dataNascimento?: string;
  necessidadesEspeciais?: string;
  observacoesComportamentais?: string;
  createdAt: string;
}

export interface Reserva {
  id: string;
  tutorId: string;
  petId: string;
  unidadeId: string;
  checkIn: string;
  checkOut: string;
  servicosAdicionais: ServicoAdicional[];
  status: 'pendente' | 'confirmada' | 'checkin' | 'hospedado' | 'checkout' | 'finalizada' | 'cancelada';
  valorTotal: number;
  codigoEstadia: string;
  pagamentoStatus: 'pendente' | 'aprovado' | 'recusado';
  createdAt: string;
}

export interface ServicoAdicional {
  id: string;
  nome: string;
  preco: number;
  icone: string;
}

export interface Unidade {
  id: string;
  nome: string;
  capacidadeCachorro: number;
  capacidadeGato: number;
  endereco: string;
}

export interface VagaDia {
  data: string;
  unidadeId: string;
  vagasCachorroTotal: number;
  vagasCachorroOcupadas: number;
  vagasGatoTotal: number;
  vagasGatoOcupadas: number;
}

export interface MensagemAgendada {
  id: string;
  tipo: 'pre-estadia' | 'durante' | 'pos-estadia' | 'aniversario';
  reservaId?: string;
  petId: string;
  tutorId: string;
  dataEnvio: string;
  status: 'agendada' | 'enviada' | 'erro';
  mensagem: string;
}
