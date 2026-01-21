import { supabase } from '@/integrations/supabase/client';

interface WhatsAppMenuOption {
  id: string;
  texto: string;
  resposta: string;
  ativo: boolean;
}

interface WhatsAppMenuConfig {
  id?: string;
  api_url: string;
  instance_token: string;
  mensagem_boas_vindas: string;
  menu_ativo: boolean;
  opcoes_menu: WhatsAppMenuOption[];
  footer_text: string | null;
  list_button_text: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export async function testConnection(config: { apiUrl: string; instanceToken: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${config.apiUrl}/instance/status`, {
      method: "GET",
      headers: {
        token: config.instanceToken,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      return { success: false, error: `Falha na conexão: ${responseText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

export async function sendTextMessage(
  config: { apiUrl: string; instanceToken: string },
  number: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${config.apiUrl}/send/text`, {
      method: "POST",
      headers: {
        token: config.instanceToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number, text }),
    });

    const data = await response.json().catch(async () => ({ raw: await response.text() }));

    if (!response.ok) {
      return { success: false, error: data.error || "Falha ao enviar mensagem" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

export async function sendWhatsAppMenu(
  config: { apiUrl: string; instanceToken: string },
  number: string,
  text: string,
  choices: WhatsAppMenuOption[],
  listButton: string,
  footerText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${config.apiUrl}/send/menu`, {
      method: "POST",
      headers: {
        token: config.instanceToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number,
        type: "list",
        text,
        choices: choices.map(c => c.texto),
        listButton,
        footerText,
      }),
    });

    const data = await response.json().catch(async () => ({ raw: await response.text() }));

    if (!response.ok) {
      return { success: false, error: data.error || "Falha ao enviar menu" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

export async function createBulkCampaign(
  config: { apiUrl: string; instanceToken: string },
  leads: Array<{ nome: string; telefone: string }>,
  message: string,
  delayMin: number,
  delayMax: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const messages = leads.map(lead => ({
      number: lead.telefone,
      text: message.replace(/\{\{nome\}\}/gi, lead.nome),
    }));

    const response = await fetch(`${config.apiUrl}/create-campaign`, {
      method: "POST",
      headers: {
        token: config.instanceToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        delayMin,
        delayMax,
      }),
    });

    const data = await response.json().catch(async () => ({ raw: await response.text() }));

    if (!response.ok) {
      return { success: false, error: data.error || "Falha ao criar campanha" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

export async function getWhatsAppConfig(): Promise<WhatsAppMenuConfig> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const configData = data as any;
      const opcoesMenu = Array.isArray(configData.opcoes_menu)
        ? configData.opcoes_menu.map((item: any) => ({
            id: item.id || '',
            texto: item.texto || '',
            resposta: item.resposta || '',
            ativo: item.ativo || false,
          }))
        : [];

      return {
        id: configData.id,
        api_url: configData.api_url,
        instance_token: configData.instance_token,
        mensagem_boas_vindas: configData.mensagem_boas_vindas || 'Olá! Como podemos te ajudar?',
        menu_ativo: configData.menu_ativo || false,
        opcoes_menu: opcoesMenu,
        footer_text: configData.footer_text || 'DentalClinic',
        list_button_text: configData.list_button_text || 'Ver Opções',
        created_at: configData.created_at,
        updated_at: configData.updated_at,
      };
    }

    return {
      api_url: '',
      instance_token: '',
      mensagem_boas_vindas: 'Olá! Como podemos te ajudar?',
      menu_ativo: false,
      opcoes_menu: [],
      footer_text: 'DentalClinic',
      list_button_text: 'Ver Opções',
    };
  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
    return {
      api_url: '',
      instance_token: '',
      mensagem_boas_vindas: 'Olá! Como podemos te ajudar?',
      menu_ativo: false,
      opcoes_menu: [],
      footer_text: 'DentalClinic',
      list_button_text: 'Ver Opções',
    };
  }
}

export async function updateWhatsAppConfig(config: WhatsAppMenuConfig): Promise<WhatsAppMenuConfig> {
  try {
    const payload: any = {
      api_url: config.api_url,
      instance_token: config.instance_token,
      mensagem_boas_vindas: config.mensagem_boas_vindas,
      menu_ativo: config.menu_ativo,
      opcoes_menu: config.opcoes_menu,
      footer_text: config.footer_text,
      list_button_text: config.list_button_text,
      updated_at: new Date().toISOString(),
    };

    if (config.id) {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .update(payload)
        .eq('id', config.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0] as any as WhatsAppMenuConfig;
      }
    } else {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .insert([payload])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0] as any as WhatsAppMenuConfig;
      }
    }

    return config;
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    throw error;
  }
}