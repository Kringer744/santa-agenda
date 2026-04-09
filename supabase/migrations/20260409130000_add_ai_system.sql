-- =============================================
-- SISTEMA DE IA PARA DENTALCLINIC
-- Baseado no modelo de IA autônoma da barbearia
-- =============================================

-- 1. Configuração da IA
CREATE TABLE IF NOT EXISTS public.ia_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ativo BOOLEAN DEFAULT false,
  provider TEXT DEFAULT 'openrouter',
  api_key TEXT DEFAULT '',
  modelo_principal TEXT DEFAULT 'google/gemini-2.0-flash-001',
  modelo_lite TEXT DEFAULT 'google/gemini-2.0-flash-lite-001',
  nome_clinica TEXT DEFAULT 'DentalClinic',
  personalidade TEXT DEFAULT 'Você é a assistente virtual da clínica odontológica. Seja educada, profissional e acolhedora. Use linguagem simples e acessível.',
  instrucoes_adicionais TEXT DEFAULT '',
  horario_funcionamento JSONB DEFAULT '{"seg": {"inicio": "08:00", "fim": "18:00"}, "ter": {"inicio": "08:00", "fim": "18:00"}, "qua": {"inicio": "08:00", "fim": "18:00"}, "qui": {"inicio": "08:00", "fim": "18:00"}, "sex": {"inicio": "08:00", "fim": "18:00"}, "sab": {"inicio": "08:00", "fim": "12:00"}, "dom": null}'::jsonb,
  endereco TEXT DEFAULT '',
  max_tokens_resposta INTEGER DEFAULT 500,
  temperatura NUMERIC(3,2) DEFAULT 0.7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ia_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on ia_config" ON public.ia_config FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_ia_config_updated_at
BEFORE UPDATE ON public.ia_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Templates de mensagens (lembretes, confirmações, aniversários, etc.)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL, -- 'lembrete_consulta', 'confirmacao_consulta', 'aniversario_paciente', 'pos_consulta', 'retorno'
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  delay_horas INTEGER DEFAULT 0, -- para lembretes: quantas horas antes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on whatsapp_templates" ON public.whatsapp_templates FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Templates padrão
INSERT INTO public.whatsapp_templates (tipo, nome, mensagem, delay_horas) VALUES
  ('confirmacao_consulta', 'Confirmação de Agendamento', 'Olá {{nome_paciente}}! Sua consulta foi agendada com Dr(a). {{nome_dentista}} para o dia {{data_consulta}} às {{hora_consulta}}. Qualquer dúvida, estamos à disposição!', 0),
  ('lembrete_consulta', 'Lembrete 1 dia antes', 'Olá {{nome_paciente}}! Lembramos que você tem uma consulta amanhã ({{data_consulta}}) às {{hora_consulta}} com Dr(a). {{nome_dentista}}. Confirma sua presença? Responda *SIM* ou *NÃO*.', 24),
  ('lembrete_consulta', 'Lembrete 2 horas antes', 'Olá {{nome_paciente}}! Sua consulta é daqui a 2 horas ({{hora_consulta}}) com Dr(a). {{nome_dentista}}. Te esperamos!', 2),
  ('aniversario_paciente', 'Parabéns de Aniversário', 'Feliz aniversário, {{nome_paciente}}! A equipe DentalClinic deseja um dia maravilhoso! Seu sorriso é nosso melhor presente.', 0),
  ('pos_consulta', 'Pós-consulta', 'Olá {{nome_paciente}}! Como você está se sentindo após a consulta? Qualquer desconforto ou dúvida, não hesite em nos procurar!', 0),
  ('retorno', 'Lembrete de Retorno', 'Olá {{nome_paciente}}! Já faz um tempo desde sua última visita. Que tal agendar seu retorno? Cuide sempre do seu sorriso!', 0)
ON CONFLICT DO NOTHING;

-- 3. Fila de lembretes agendados (worker independente)
CREATE TABLE IF NOT EXISTS public.lembretes_agendados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consulta_id UUID REFERENCES public.consultas(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  telefone TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  agendado_para TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'enviado', 'erro', 'cancelado'
  tentativas INTEGER DEFAULT 0,
  erro_msg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enviado_at TIMESTAMPTZ
);

ALTER TABLE public.lembretes_agendados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on lembretes_agendados" ON public.lembretes_agendados FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_lembretes_status_agendado ON public.lembretes_agendados(status, agendado_para)
  WHERE status = 'pendente';

-- 4. Contexto de conversa da IA (memória de curto prazo)
CREATE TABLE IF NOT EXISTS public.ia_conversas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT NOT NULL UNIQUE,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
  contexto JSONB DEFAULT '[]'::jsonb, -- últimas N mensagens [{role, content, timestamp}]
  intencao_detectada TEXT, -- 'agendamento', 'horario', 'preco', 'duvida', 'cancelamento'
  atendente_assumiu BOOLEAN DEFAULT false,
  ia_ativa BOOLEAN DEFAULT true,
  ultima_mensagem_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ia_conversas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on ia_conversas" ON public.ia_conversas FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_ia_conversas_updated_at
BEFORE UPDATE ON public.ia_conversas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Log de interações da IA (métricas e debug)
CREATE TABLE IF NOT EXISTS public.ia_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT NOT NULL,
  mensagem_recebida TEXT,
  resposta_ia TEXT,
  intencao TEXT,
  modelo_usado TEXT,
  tokens_entrada INTEGER DEFAULT 0,
  tokens_saida INTEGER DEFAULT 0,
  tempo_resposta_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ia_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on ia_logs" ON public.ia_logs FOR ALL USING (true) WITH CHECK (true);

-- Índice para consultas recentes
CREATE INDEX idx_ia_logs_created ON public.ia_logs(created_at DESC);

-- 6. Adicionar colunas faltantes em whatsapp_messages
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS consulta_id UUID;
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS paciente_id UUID;

-- 7. Adicionar colunas faltantes em whatsapp_config
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT 'DentalClinic';
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS list_button_text TEXT DEFAULT 'Ver Opções';
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS parabens_automatico BOOLEAN DEFAULT true;

-- 8. Inserir config IA padrão
INSERT INTO public.ia_config (ativo, nome_clinica, personalidade)
VALUES (false, 'DentalClinic', 'Você é a assistente virtual da clínica odontológica DentalClinic. Seja educada, profissional e acolhedora. Ajude os pacientes com agendamentos, dúvidas sobre procedimentos e informações gerais.')
ON CONFLICT DO NOTHING;
