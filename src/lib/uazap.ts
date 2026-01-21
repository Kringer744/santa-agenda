import { supabase } from '@/integrations/supabase/client';
import { WhatsAppMenuConfig, WhatsAppMenuOption, Conversation, InteractionLog } from '@/types';

interface UazapConfig {
  apiUrl: string;
  instanceToken: string;
}

// Testar conexão com a API
export async function testConnection(config: UazapConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('uazap-send', {
      body: {
        action: 'test',
        apiUrl: config.apiUrl,
        instanceToken: config.instanceToken,
      },
    });

    if (error) throw error;
    return { success: data?.success || false, error: data?.error };
  } catch (error: any) {
    console.error('Erro ao testar conexão:', error);
    return { success: false, error: error.message };
  }
}

// Enviar menu interativo (lista nativa do WhatsApp)
export async function sendWhatsAppMenu(
  config: UazapConfig,
  number: string,
  welcomeMessage: string,
  options: WhatsAppMenuOption[],
  listButtonText: string = 'Ver Opções',
  footerText: string = 'DentalClinic'
): Promise<{ success: boolean; error?: string }> {
  try {
    const activeOptions = options.filter(o => o.ativo);
    
    // Formato UAZAPI: "[Seção]", "Título|id|Descrição"
    // Alterado: Descrição vazia para manter o menu limpo
    const choices: string[] = [
      '[Opções]', 
      ...activeOptions.map(o => `${o.texto}|${o.id}|`)
    ];

    const { data, error } = await supabase.functions.invoke('uazap-send', {
      body: {
        action: 'send-menu',
        apiUrl: config.apiUrl,
        instanceToken: config.instanceToken,
        number: formatPhoneNumber(number),
        text: welcomeMessage,
        choices,
        listButton: listButtonText,
        footerText: footerText,
      },
    });

    if (error) throw error;
    return { success: data?.success || false, error: data?.error };
  } catch (error: any) {
    console.error('Erro ao enviar menu:', error);
    return { success: false, error: error.message };
  }
}

// Enviar mensagem de texto
export async function sendTextMessage(
  config: UazapConfig,
  number: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('uazap-send', {
      body: {
        action: 'send-text',
        apiUrl: config.apiUrl,
        instanceToken: config.instanceToken,
        number: formatPhoneNumber(number),
        text,
      },
    });

    if (error) throw error;
    return { success: data?.success || false, error: data?.error };
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    return { success: false, error: error.message };
  }
}

// Enviar mensagem com imagem (QR Code)
export async function sendImageMessage(
  config: UazapConfig,
  number: string,
  base64Image: string,
  caption: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('uazap-send', {
      body: {
        action: 'send-image',
        apiUrl: config.apiUrl,
        instanceToken: config.instanceToken,
        number: formatPhoneNumber(number),
        base64: base64Image,
        caption: caption,
      },
    });

    if (error) throw error;
    return { success: data?.success || false, error: data?.error };
  } catch (error: any) {
    console.error('Erro ao enviar imagem:', error);
    return { success: false, error: error.message };
  }
}

// Criar campanha de disparo em massa
export async function createBulkCampaign(
  config: UazapConfig,
  leads: { nome: string; telefone: string; email?: string }[],
  messageTemplate: string,
  delayMin: number,
  delayMax: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const messages = leads.map(lead => ({
      number: formatPhoneNumber(lead.telefone),
      type: 'text',
      text: replaceTemplateVariables(messageTemplate, lead),
    }));

    const { data, error } = await supabase.functions.invoke('uazap-send', {
      body: {
        action: 'create-campaign',
        apiUrl: config.apiUrl,
        instanceToken: config.instanceToken,
        messages,
        delayMin,
        delayMax,
        info: `Campanha - ${new Date().toLocaleDateString('pt-BR')}`,
        scheduled_for: 1, // Inicia em 1 minuto
      },
    });

    if (error) throw error;
    return { success: data?.success || false, error: data?.error };
  } catch (error: any) {
    console.error('Erro ao criar campanha:', error);
    return { success: false, error: error.message };
  }
}

// Formatar número de telefone para formato brasileiro
export function formatPhoneNumber(phone: string): string {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começa com 55, adiciona
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

// Substituir variáveis no template de mensagem
function replaceTemplateVariables(
  template: string, 
  lead: { nome: string; telefone: string; email?: string }
): string {
  const safeNome = (lead.nome || '').trim() || 'Cliente';
  const safeTelefone = lead.telefone || '';
  const safeEmail = lead.email || '';

  return template
    .replace(/\{\{nome\}\}/gi, safeNome)
    .replace(/\{\{telefone\}\}/gi, safeTelefone)
    .replace(/\{\{email\}\}/gi, safeEmail);
}

// --- NOVAS FUNÇÕES PARA GERENCIAMENTO DE ESTADO E LOGS ---

export const getWhatsAppConfig = async (): Promise<WhatsAppMenuConfig | null> => {
  const { data, error } = await supabase
    .from('whatsapp_config')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[UAZAP Lib] Erro ao buscar configuração do WhatsApp:", error);
    return null;
  }

  if (!data) {
    // Se não houver configuração, retorna um default para o frontend
    return {
      api_url: '',
      instance_token: '',
      mensagem_boas_vindas: 'Olá! 🦷 Seja bem-vindo à nossa Clínica Odontológica. Como podemos cuidar do seu sorriso hoje?',
      menu_ativo: false,
      opcoes_menu: [
        { id: '1', texto: '🗓️ Agendar uma consulta', resposta: 'Ótimo! Para agendar sua consulta, acesse nosso link: https://dental-clinic.lovable.app/client-appointment', ativo: true },
        { id: '2', texto: '🦷 Conhecer procedimentos', resposta: 'Temos diversos procedimentos: Limpeza, Clareamento, Ortodontia e mais. Qual você gostaria de saber o preço?', ativo: true },
        { id: '3', texto: '📞 Falar com atendimento', resposta: 'Vou transferir você para um atendente. Aguarde um momento!', ativo: true },
      ],
      footer_text: 'DentalClinic - Atendimento Automático',
      list_button_text: 'Ver Opções',
    };
  }

  return {
    id: data.id,
    api_url: data.api_url,
    instance_token: data.instance_token,
    mensagem_boas_vindas: data.mensagem_boas_vindas || 'Olá! 🦷 Seja bem-vindo à nossa Clínica Odontológica. Como podemos cuidar do seu sorriso hoje?',
    menu_ativo: data.menu_ativo || false,
    opcoes_menu: (data.opcoes_menu as WhatsAppMenuOption[]) || [],
    footer_text: data.footer_text || 'DentalClinic - Atendimento Automático',
    list_button_text: data.list_button_text || 'Ver Opções',
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

export const updateWhatsAppConfig = async (config: WhatsAppMenuConfig) => {
  const payload = {
    api_url: config.api_url,
    instance_token: config.instance_token,
    mensagem_boas_vindas: config.mensagem_boas_vindas,
    menu_ativo: config.menu_ativo,
    opcoes_menu: config.opcoes_menu,
    footer_text: config.footer_text,
    list_button_text: config.list_button_text,
    updated_at: new Date().toISOString()
  };

  if (config.id) {
    const { error } = await supabase
      .from('whatsapp_config')
      .update(payload)
      .eq('id', config.id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data as WhatsAppMenuConfig;
  }
  return config;
};

export const getConversationState = async (phoneNumber: string): Promise<Conversation | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('phone_number', phoneNumber)
    .maybeSingle();
  
  if (error) console.error("[UAZAP Lib] Erro ao buscar estado da conversa:", error);
  return data as Conversation;
};

export const updateConversationState = async (phoneNumber: string, updates: Partial<Conversation>): Promise<Conversation | null> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('conversations')
    .upsert({ phone_number: phoneNumber, ...updates, updated_at: now }, { onConflict: 'phone_number' })
    .select()
    .single();
  
  if (error) console.error("[UAZAP Lib] Erro ao atualizar estado da conversa:", error);
  return data as Conversation;
};

export const logInteraction = async (log: Omit<InteractionLog, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('interaction_logs')
    .insert(log);
  
  if (error) console.error("[UAZAP Lib] Erro ao registrar interação:", error);
};