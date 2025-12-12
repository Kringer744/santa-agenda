import { Tutor, Pet, Reserva, Unidade, ServicoAdicional, VagaDia } from '@/types';

export const servicosAdicionais: ServicoAdicional[] = [
  { id: '1', nome: 'Banho e Tosa', preco: 80, icone: '🛁' },
  { id: '2', nome: 'Recreação', preco: 40, icone: '🎾' },
  { id: '3', nome: 'Medicação Assistida', preco: 30, icone: '🩺' },
  { id: '4', nome: 'Fotos e Vídeos Diários', preco: 25, icone: '📸' },
];

export const unidades: Unidade[] = [
  { id: '1', nome: 'Unidade Centro', capacidadeCachorro: 20, capacidadeGato: 10, endereco: 'Rua das Flores, 123' },
  { id: '2', nome: 'Unidade Jardins', capacidadeCachorro: 30, capacidadeGato: 15, endereco: 'Av. Principal, 456' },
];

export const tutoresMock: Tutor[] = [
  {
    id: '1',
    nome: 'Maria Silva',
    cpf: '123.456.789-00',
    telefone: '11999999999',
    email: 'maria@email.com',
    dataNascimento: '1985-05-15',
    createdAt: '2024-01-15',
    tags: ['recorrente', 'usa serviços extras'],
  },
  {
    id: '2',
    nome: 'João Santos',
    cpf: '987.654.321-00',
    telefone: '11988888888',
    email: 'joao@email.com',
    dataNascimento: '1990-08-20',
    createdAt: '2024-02-20',
    tags: ['novo'],
  },
];

export const petsMock: Pet[] = [
  {
    id: '1',
    tutorId: '1',
    nome: 'Rex',
    especie: 'cachorro',
    raca: 'Golden Retriever',
    porte: 'grande',
    idade: 3,
    dataNascimento: '2021-03-10',
    observacoesComportamentais: 'Muito dócil, adora brincar com outros cães',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    tutorId: '1',
    nome: 'Mia',
    especie: 'gato',
    raca: 'Siamês',
    porte: 'pequeno',
    idade: 2,
    dataNascimento: '2022-07-22',
    necessidadesEspeciais: 'Dieta especial - ração hipoalergênica',
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    tutorId: '2',
    nome: 'Thor',
    especie: 'cachorro',
    raca: 'Bulldog Francês',
    porte: 'pequeno',
    idade: 4,
    dataNascimento: '2020-12-05',
    createdAt: '2024-02-20',
  },
];

export const reservasMock: Reserva[] = [
  {
    id: '1',
    tutorId: '1',
    petId: '1',
    unidadeId: '1',
    checkIn: '2024-12-12',
    checkOut: '2024-12-15',
    servicosAdicionais: [servicosAdicionais[0], servicosAdicionais[3]],
    status: 'hospedado',
    valorTotal: 455,
    codigoEstadia: 'PH2024001',
    pagamentoStatus: 'aprovado',
    createdAt: '2024-12-01',
  },
  {
    id: '2',
    tutorId: '2',
    petId: '3',
    unidadeId: '1',
    checkIn: '2024-12-13',
    checkOut: '2024-12-16',
    servicosAdicionais: [servicosAdicionais[1]],
    status: 'confirmada',
    valorTotal: 340,
    codigoEstadia: 'PH2024002',
    pagamentoStatus: 'aprovado',
    createdAt: '2024-12-05',
  },
];

export const vagasDiaMock: VagaDia[] = [
  { data: '2024-12-12', unidadeId: '1', vagasCachorroTotal: 20, vagasCachorroOcupadas: 12, vagasGatoTotal: 10, vagasGatoOcupadas: 3 },
  { data: '2024-12-13', unidadeId: '1', vagasCachorroTotal: 20, vagasCachorroOcupadas: 15, vagasGatoTotal: 10, vagasGatoOcupadas: 5 },
  { data: '2024-12-14', unidadeId: '1', vagasCachorroTotal: 20, vagasCachorroOcupadas: 18, vagasGatoTotal: 10, vagasGatoOcupadas: 7 },
  { data: '2024-12-15', unidadeId: '1', vagasCachorroTotal: 20, vagasCachorroOcupadas: 10, vagasGatoTotal: 10, vagasGatoOcupadas: 4 },
];
