-- Criar tabela de unidades
CREATE TABLE public.unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  capacidade_cachorro INTEGER NOT NULL DEFAULT 10,
  capacidade_gato INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de serviços adicionais
CREATE TABLE public.servicos_adicionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  icone TEXT DEFAULT 'star',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de tutores
CREATE TABLE public.tutores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  email TEXT,
  data_nascimento DATE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pets
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES public.tutores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especie TEXT NOT NULL CHECK (especie IN ('cachorro', 'gato')),
  raca TEXT,
  porte TEXT CHECK (porte IN ('pequeno', 'medio', 'grande')),
  idade INTEGER,
  data_nascimento DATE,
  necessidades_especiais TEXT,
  observacoes_comportamentais TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de reservas
CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES public.tutores(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  servicos_adicionais UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'checkin', 'hospedado', 'checkout', 'finalizada', 'cancelada')),
  valor_total DECIMAL(10,2) DEFAULT 0,
  codigo_estadia TEXT,
  pagamento_status TEXT DEFAULT 'pendente' CHECK (pagamento_status IN ('pendente', 'aprovado', 'recusado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vagas por dia
CREATE TABLE public.vagas_dia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  vagas_cachorro_total INTEGER NOT NULL DEFAULT 10,
  vagas_cachorro_ocupadas INTEGER NOT NULL DEFAULT 0,
  vagas_gato_total INTEGER NOT NULL DEFAULT 5,
  vagas_gato_ocupadas INTEGER NOT NULL DEFAULT 0,
  UNIQUE(data, unidade_id)
);

-- Habilitar RLS
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas_dia ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (ajustar conforme necessidade de auth)
CREATE POLICY "Allow all on unidades" ON public.unidades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on servicos_adicionais" ON public.servicos_adicionais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tutores" ON public.tutores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on pets" ON public.pets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on reservas" ON public.reservas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vagas_dia" ON public.vagas_dia FOR ALL USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_unidades_updated_at BEFORE UPDATE ON public.unidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tutores_updated_at BEFORE UPDATE ON public.tutores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON public.reservas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir unidade padrão
INSERT INTO public.unidades (nome, endereco, capacidade_cachorro, capacidade_gato) 
VALUES ('Unidade Principal', 'Endereço da unidade principal', 10, 5);

-- Inserir serviços adicionais padrão
INSERT INTO public.servicos_adicionais (nome, preco, icone) VALUES
('Banho', 50.00, 'bath'),
('Tosa', 40.00, 'scissors'),
('Recreação', 30.00, 'gamepad'),
('Medicação', 20.00, 'pill'),
('Fotos/Vídeos', 25.00, 'camera');