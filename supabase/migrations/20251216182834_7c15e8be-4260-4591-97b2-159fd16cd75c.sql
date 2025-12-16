-- Tabela para rastrear conversas e saber se atendente assumiu ou não
CREATE TABLE public.whatsapp_conversas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT NOT NULL UNIQUE,
  atendente_assumiu BOOLEAN DEFAULT FALSE,
  ultima_mensagem_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  menu_enviado_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: público (sem auth nesta app)
ALTER TABLE public.whatsapp_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on whatsapp_conversas"
ON public.whatsapp_conversas
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_conversas_updated_at
BEFORE UPDATE ON public.whatsapp_conversas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();