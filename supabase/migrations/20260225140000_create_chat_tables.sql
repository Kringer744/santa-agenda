-- Tabela para armazenar as configurações de cada clínica
CREATE TABLE public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    chatwoot_base_url TEXT,
    chatwoot_account_id BIGINT UNIQUE,
    chatwoot_api_token TEXT, -- Em um cenário de produção, isso deve ser criptografado.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read clinics" ON public.clinics FOR SELECT TO authenticated USING (true);

-- Tabela para armazenar as conversas, sendo nosso sistema a fonte da verdade
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    chatwoot_conversation_id BIGINT UNIQUE,
    patient_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open', -- open | pending | resolved
    priority TEXT DEFAULT 'normal', -- normal | urgente
    assigned_user_id UUID, -- Futuramente, para vincular a um usuário/atendente do nosso sistema
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    channel TEXT DEFAULT 'whatsapp',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage conversations" ON public.conversations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela para armazenar cada mensagem de cada conversa
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    chatwoot_message_id BIGINT UNIQUE,
    direction TEXT NOT NULL, -- incoming | outgoing
    content TEXT,
    status TEXT DEFAULT 'sent', -- sent | delivered | failed
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to manage messages" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserir a primeira clínica
INSERT INTO public.clinics (name, chatwoot_base_url, chatwoot_account_id, chatwoot_api_token)
VALUES ('Fluxo Digital Tech', 'https://atendimento.fluxodigitaltech.com.br', 6, 'y7GSV1ojZBRPdvu3MJ5ngSJQ');