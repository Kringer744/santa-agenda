import { Tutor, Pet, Reserva, Unidade, ServicoAdicional, VagaDia } from '@/types';

export const servicosAdicionais: ServicoAdicional[] = [
  { id: '1', nome: 'Banho e Tosa', preco: 80, icone: '🛁', ativo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '2', nome: 'Recreação', preco: 40, icone: '🎾', ativo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '3', nome: 'Medicação Assistida', preco: 30, icone: '🩺', ativo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: '4', nome: 'Fotos e Vídeos Diários', preco: 25, icone: '📸', ativo: true, created_at: '2024-01-01T00:00:00Z' },
];

export const unidades: Unidade[] = [
  { id: '1', nome: 'Unidade Centro', capacidade_cachorro: 20, capacidade_gato: 10, endereco: 'Rua das Flores, 123', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: '2', nome: 'Unidade Jardins', capacidade_cachorro: 30, capacidade_gato: 15, endereco: 'Av. Principal, 456', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

export const tutoresMock: Tutor[] = [
  {
    id: '1',
    nome: 'Maria Silva',
    cpf: '123.456.789-00',
    telefone: '11999999999',
    email: 'maria@email.com',
    data_nascimento: '1985-05-15',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    tags: ['recorrente', 'usa serviços extras'],
  },
  {
    id: '2',
    nome: 'João Santos',
    cpf: '987.654.321-00',
    telefone: '11988888888',
    email: 'joao@email.com',
    data_nascimento: '1990-08-20',
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
    tags: ['novo'],
  },
];

export const petsMock: Pet[] = [
  {
    id: '1',
    tutor_id: '1',
    nome: 'Rex',
    especie: 'cachorro',
    raca: 'Golden Retriever',
    porte: 'grande',
    idade: 3,
    data_nascimento: '2021-03-10',
    observacoes_comportamentais: 'Muito dócil, adora brincar com outros cães',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    necessidades_especiais: null,
  },
  {
    id: '2',
    tutor_id: '1',
    nome: 'Mia',
    especie: 'gato',
    raca: 'Siamês',
    porte: 'pequeno',
    idade: 2,
    data_nascimento: '2022-07-22',
    necessidades_especiais: 'Dieta especial - ração hipoalergênica',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    observacoes_comportamentais: null,
  },
  {
    id: '3',
    tutor_id: '2',
    nome: 'Thor',
    especie: 'cachorro',
    raca: 'Bulldog Francês',
    porte: 'pequeno',
    idade: 4,
    data_nascimento: '2020-12-05',
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
    necessidades_especiais: null,
    observacoes_comportamentais: null,
  },
];

export const reservasMock: Reserva[] = [
  {
    id: '1',
    tutor_id: '1',
    pet_id: '1',
    unidade_id: '1',
    check_in: '2024-12-12',
    check_out: '2024-12-15',
    servicos_adicionais: [servicosAdicionais[0].id, servicosAdicionais[3].id], // Store IDs
    status: 'hospedado',
    valor_total: 455,
    codigo_estadia: 'PH2024001',
    pagamento_status: 'aprovado',
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z',
  },
  {
    id: '2',
    tutor_id: '2',
    pet_id: '3',
    unidade_id: '1',
    check_in: '2024-12-13',
    check_out: '2024-12-16',
    servicos_adicionais: [servicosAdicionais[1].id], // Store IDs
    status: 'confirmada',
    valor_total: 340,
    codigo_estadia: 'PH2024002',
    pagamento_status: 'aprovado',
    created_at: '2024-12-05T00:00:00Z',
    updated_at: '2024-12-05T00:00:00Z',
  },
];

export const vagasDiaMock: VagaDia[] = [
  { id: 'vd1', data: '2024-12-12', unidade_id: '1', vagas_cachorro_total: 20, vagas_cachorro_ocupadas: 12, vagas_gato_total: 10, vagas_gato_ocupadas: 3 },
  { id: 'vd2', data: '2024-12-13', unidade_id: '1', vagas_cachorro_total: 20, vagas_cachorro_ocupadas: 15, vagas_gato_total: 10, vagas_gato_ocupadas: 5 },
  { id: 'vd3', data: '2024-12-14', unidade_id: '1', vagas_cachorro_total: 20, vagas_cachorro_ocupadas: 18, vagas_gato_total: 10, vagas_gato_ocupadas: 7 },
  { id: 'vd4', data: '2024-12-15', unidade_id: '1', vagas_cachorro_total: 20, vagas_cachorro_ocupadas: 10, vagas_gato_total: 10, vagas_gato_ocupadas: 4 },
];