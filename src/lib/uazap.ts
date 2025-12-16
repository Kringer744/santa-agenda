import { supabase } from '@/integrations/supabase/client';

interface UazapConfig {
  apiUrl: string;
  instanceToken: string;
}

interface MenuOption {
  id: string;
  texto: string;
  resposta: string;
  ativo: boolean;
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
export async function sendInteractiveMenu(
  config: UazapConfig,
  number: string,
  welcomeMessage: string,
  options: MenuOption[],
  listButton: string = 'Menu de Atendimento',
  footerText: string = 'Hotel para Pets'
): Promise<{ success: boolean; error?: string }> {
  try {
    const activeOptions = options.filter(o => o.ativo);
    
    // Formato UAZAPI: "[Seção]", "Título|id|Descrição"
    const choices: string[] = [
      '[Atendimento]', // Seção principal
      ...activeOptions.map(o => `${o.texto}|${o.id}|${o.resposta.substring(0, 72)}`)
    ];

    const { data, error } = await supabase.functions.invoke('uazap-send', {
      body: {
        action: 'send-menu',
        apiUrl: config.apiUrl,
        instanceToken: config.instanceToken,
        number: formatPhoneNumber(number),
        text: welcomeMessage,
        choices,
        listButton,
        footerText,
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
function formatPhoneNumber(phone: string): string {
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
