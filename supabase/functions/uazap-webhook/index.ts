// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, token",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) cleaned = '55' + cleaned;
  return cleaned;
}

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
}

interface Conversation {
  phone_number: string;
  is_with_attendant: boolean;
  attendant_assigned_at: string | null;
  last_attendant_message_at: string | null;
  last_menu_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // @ts-ignore: Deno namespace
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  // @ts-ignore: Deno namespace
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // URL do preview para redirecionamento (ou URL de produção)
  const APP_URL = "https://preview-ktepifvhpdgexdgvhxpq.lovable.app"; 

  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message ?? {};
    
    console.log("[WEBHOOK] Body recebido:", JSON.stringify(body));

    // Ignora mensagens enviadas pela própria instância
    if (message?.fromMe) {
      console.log("[WEBHOOK] Ignored message from self.");
      return jsonResponse({ ok: true, message: "Ignored message from self" });
    }

    const rawFrom = body?.chat?.phone ?? message?.sender ?? "";
    if (!rawFrom) {
      console.warn("[WEBHOOK] No sender phone found in message.");
      return jsonResponse({ ok: true, message: "No sender phone found" });
    }

    const fromNumber = formatPhoneNumber(rawFrom);
    const receivedText = (message?.text ?? "").toLowerCase().trim();
    console.log(`[WEBHOOK] Received message from ${fromNumber}: "${receivedText}"`);

    // Carrega a configuração do WhatsApp
    const { data: config, error: configError } = await supabase.from('whatsapp_config').select('*').limit(1).maybeSingle();
    if (configError) {
      console.error("[WEBHOOK] Erro ao carregar configuração:", configError.message);
      return jsonResponse({ ok: false, error: "Erro ao carregar configuração" }, 500);
    }
    if (!config) {
      console.warn("[WEBHOOK] Nenhuma configuração de WhatsApp encontrada. Ignorando mensagem.");
      return jsonResponse({ ok: true, message: "No WhatsApp config found" });
    }

    const uazapApiUrl = config.api_url;
    const uazapInstanceToken = config.instance_token;
    const menuIsActive = config.menu_ativo;
    const welcomeMessage = config.mensagem_boas_vindas || 'Olá! Seja bem-vindo à DentalClinic.';
    const menuOptions = (config.opcoes_menu as WhatsAppMenuOption[]) || [];
    const activeMenuOptions = menuOptions.filter(o => o.ativo);
    const footerText = config.footer_text || 'DentalClinic';
    const listButtonText = config.list_button_text || 'Ver Opções';

    if (!uazapApiUrl || !uazapInstanceToken) {
      console.error("[WEBHOOK] UAZAP API URL or Instance Token missing in config.");
      return jsonResponse({ ok: false, error: "Configuração incompleta" }, 400);
    }

    const uazapHeaders = {
      token: uazapInstanceToken,
      "Content-Type": "application/json",
    };

    // --- Gerenciamento do Estado da Conversa ---
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('phone_number', fromNumber)
      .maybeSingle();

    if (convError) {
      console.error("[WEBHOOK] Erro ao buscar conversa:", convError.message);
      return jsonResponse({ ok: false, error: "Erro ao buscar conversa" }, 500);
    }

    const now = new Date();
    const ATTENDANT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

    // Se a conversa não existe, cria uma nova
    if (!conversation) {
      const { data: newConv, error: createConvError } = await supabase
        .from('conversations')
        .insert({ phone_number: fromNumber, created_at: now.toISOString(), updated_at: now.toISOString() })
        .select()
        .single();
      if (createConvError) console.error("[WEBHOOK] Erro ao criar conversa:", createConvError.message);
      conversation = newConv;
    } else {
      // Verifica timeout do atendente
      if (conversation.is_with_attendant && conversation.last_attendant_message_at) {
        const lastAttendantMsgTime = new Date(conversation.last_attendant_message_at);
        if (now.getTime() - lastAttendantMsgTime.getTime() > ATTENDANT_TIMEOUT_MS) {
          console.log(`[WEBHOOK] Atendente inativo para ${fromNumber}. Desativando modo atendente.`);
          conversation.is_with_attendant = false;
          conversation.attendant_assigned_at = null;
          conversation.last_attendant_message_at = null;
          await supabase.from('conversations').update({ is_with_attendant: false, attendant_assigned_at: null, last_attendant_message_at: null, updated_at: now.toISOString() }).eq('phone_number', fromNumber);
          // Opcional: Enviar mensagem informando que o atendente saiu
          await fetch(`${uazapApiUrl}/send/text`, {
            method: "POST",
            headers: uazapHeaders,
            body: JSON.stringify({ number: fromNumber, text: "Olá! O atendente não respondeu por um tempo. O atendimento automático foi reativado. Como posso ajudar?" }),
          });
        }
      }
    }

    // Comando "reset"
    if (receivedText === "reset") {
      console.log(`[WEBHOOK] Comando 'reset' recebido de ${fromNumber}.`);
      await supabase.from('conversations').update({ is_with_attendant: false, attendant_assigned_at: null, last_attendant_message_at: null, updated_at: now.toISOString() }).eq('phone_number', fromNumber);
      await fetch(`${uazapApiUrl}/send/text`, {
        method: "POST",
        headers: uazapHeaders,
        body: JSON.stringify({ number: fromNumber, text: "🤖 Modo de atendimento automático reativado. Como posso ajudar?" }),
      });
      return jsonResponse({ ok: true, action: "reset_command" });
    }

    // Se estiver em modo de atendimento humano, o bot não responde
    if (conversation?.is_with_attendant) {
      console.log(`[WEBHOOK] ${fromNumber} está em modo de atendimento humano. Ignorando bot.`);
      return jsonResponse({ ok: true, message: "In attendant mode, bot ignored" });
    }

    // --- Lidar com a seleção de uma opção do menu ---
    // O WhatsApp retorna o texto exato da opção quando ela é clicada na lista
    const selectedOption = activeMenuOptions.find(option => 
      option.texto.toLowerCase().trim() === receivedText
    );

    if (selectedOption) {
      console.log(`[WEBHOOK] Opção selecionada: "${selectedOption.texto}"`);
      let responseText = selectedOption.resposta;

      // Registrar interação
      await supabase.from('interaction_logs').insert({
        phone_number: fromNumber,
        option_id: selectedOption.id,
        option_title: selectedOption.texto,
        received_text: receivedText,
        created_at: now.toISOString()
      });

      // Tratamento especial para agendamento
      if (selectedOption.id === '1' || selectedOption.texto.toLowerCase().includes('agendar')) {
        const { data: paciente } = await supabase
          .from('pacientes')
          .select('id, nome')
          .eq('telefone', fromNumber)
          .maybeSingle();

        let link = `${APP_URL}/client-appointment`;
        if (paciente) {
          link += `?paciente_id=${paciente.id}`;
          responseText = `Olá ${paciente.nome}! Para agendar sua consulta, use este link:\n\n${link}`;
        } else {
          responseText = `Olá! Para agendar na DentalClinic, acesse:\n\n${link}`;
        }
      }
      
      // Tratamento especial para "Falar com atendente"
      if (selectedOption.id === 'attendant' || selectedOption.texto.toLowerCase().includes('atendente')) {
        console.log(`[WEBHOOK] ${fromNumber} solicitou atendimento humano.`);
        await supabase.from('conversations').update({ 
          is_with_attendant: true, 
          attendant_assigned_at: now.toISOString(), 
          last_attendant_message_at: now.toISOString(), // Marca a última mensagem como agora para iniciar o timeout
          updated_at: now.toISOString() 
        }).eq('phone_number', fromNumber);
      }

      // Envia a resposta através da clínica (número que encaminhou o menu)
      await fetch(`${uazapApiUrl}/send/text`, {
        method: "POST",
        headers: uazapHeaders,
        body: JSON.stringify({ number: fromNumber, text: responseText }),
      });

      return jsonResponse({ ok: true, sent: true, action: "sent_option_response" });
    }

    // --- Anti-spam para envio de menu ---
    if (conversation?.last_menu_sent_at) {
      const lastMenuSentTime = new Date(conversation.last_menu_sent_at);
      const ANTI_SPAM_DELAY_MS = 10 * 1000; // 10 segundos
      if (now.getTime() - lastMenuSentTime.getTime() < ANTI_SPAM_DELAY_MS) {
        console.log(`[WEBHOOK] Anti-spam ativado para ${fromNumber}. Menu não enviado.`);
        return jsonResponse({ ok: true, message: "Anti-spam active, menu not sent" });
      }
    }

    // --- Enviar menu inicial (limpo) se nenhuma opção foi selecionada e o menu estiver ativo ---
    if (menuIsActive) {
      // Construindo choices sem descrição (Title|id|)
      const choices: string[] = [
        '[Opções]', 
        ...activeMenuOptions.map(o => `${o.texto}|${o.id}|`)
      ];

      if (choices.length > 1) {
        console.log(`[WEBHOOK] Enviando menu para ${fromNumber}.`);
        await fetch(`${uazapApiUrl}/send/menu`, {
          method: "POST",
          headers: uazapHeaders,
          body: JSON.stringify({
            number: fromNumber,
            type: "list",
            text: welcomeMessage,
            choices,
            listButton: listButtonText,
            footerText: footerText,
          }),
        });
        // Atualiza o timestamp do último menu enviado
        await supabase.from('conversations').update({ last_menu_sent_at: now.toISOString(), updated_at: now.toISOString() }).eq('phone_number', fromNumber);

        return jsonResponse({ ok: true, sent: true, action: "sent_menu" });
      }
    }

    console.log(`[WEBHOOK] Nenhuma ação automática para ${fromNumber}.`);
    return jsonResponse({ ok: true, action: "no_action" });
  } catch (err: any) {
    console.error("[WEBHOOK ERROR]:", err.message);
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
});