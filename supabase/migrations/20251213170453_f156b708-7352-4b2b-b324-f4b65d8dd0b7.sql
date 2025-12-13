-- Tabela para configurações do WhatsApp
CREATE TABLE public.whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_url TEXT NOT NULL,
  instance_token TEXT NOT NULL,
  menu_ativo BOOLEAN DEFAULT false,
  mensagem_boas_vindas TEXT DEFAULT 'Olá! 🐾 Seja bem-vindo ao nosso Hotel para Pets. Como podemos cuidar do seu pet hoje?',
  opcoes_menu JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para leads importados
CREATE TABLE public.whatsapp_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para campanhas de disparo
CREATE TABLE public.whatsapp_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  delay_min INTEGER DEFAULT 10,
  delay_max INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  total_leads INTEGER DEFAULT 0,
  enviados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para histórico de mensagens
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT DEFAULT 'enviada',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS - Por enquanto público para simplificar (sistema interno)
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (sistema interno sem login por enquanto)
CREATE POLICY "Allow all on whatsapp_config" ON public.whatsapp_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on whatsapp_leads" ON public.whatsapp_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on whatsapp_campaigns" ON public.whatsapp_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on whatsapp_messages" ON public.whatsapp_messages FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_config_updated_at
BEFORE UPDATE ON public.whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();