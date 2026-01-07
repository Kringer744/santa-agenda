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

interface MenuOption {
  id: string;
  texto: string;
  resposta: string;
  ativo: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // @ts-ignore: Deno namespace
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  // @ts-ignore: Deno namespace
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // URL do preview para redirecionamento
  const APP_URL = "https://preview-ktepifvhpdgexdgvhxpq.lovable.app"; 

  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message ?? {};
    
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
    if (!config) return jsonResponse({ ok: true, message: "No WhatsApp config found" });

    const uazapApiUrl = config.api_url;
    const uazapInstanceToken = config.instance_token;

    if (!uazapApiUrl || !uazapInstanceToken) {
      console.error("[WEBHOOK] UAZAP API URL or Instance Token missing in config.");
      return jsonResponse({ ok: false, error: "Configuração incompleta" }, 400);
    }

    const uazapHeaders = {
      token: uazapInstanceToken,
      "Content-Type": "application/json",
    };

    const menuOptions = (config.opcoes_menu as any as MenuOption[]) || [];
    const activeMenuOptions = menuOptions.filter(o => o.ativo);

    // --- Lidar com a seleção de uma opção do menu ---
    // O WhatsApp retorna o texto exato da opção quando ela é clicada na lista
    const selectedOption = activeMenuOptions.find(option => 
      option.texto.toLowerCase().trim() === receivedText
    );

    if (selectedOption) {
      console.log(`[WEBHOOK] Opção selecionada: "${selectedOption.texto}"`);
      let responseText = selectedOption.resposta;

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

      // Envia a resposta através da clínica (número que encaminhou o menu)
      await fetch(`${uazapApiUrl}/send/text`, {
        method: "POST",
        headers: uazapHeaders,
        body: JSON.stringify({ number: fromNumber, text: responseText }),
      });

      return jsonResponse({ ok: true, sent: true, action: "sent_option_response" });
    }

    // --- Enviar menu inicial (limpo) se nenhuma opção foi selecionada ---
    if (config.menu_ativo) {
      const welcomeMessage = config.mensagem_boas_vindas || 'Olá! Seja bem-vindo à DentalClinic.';
      
      // Construindo choices sem descrição (Title|id|)
      const choices: string[] = [
        '[Opções]', 
        ...activeMenuOptions.map(o => `${o.texto}|${o.id}|`)
      ];

      if (choices.length > 1) {
        await fetch(`${uazapApiUrl}/send/menu`, {
          method: "POST",
          headers: uazapHeaders,
          body: JSON.stringify({
            number: fromNumber,
            type: "list",
            text: welcomeMessage,
            choices,
            listButton: 'Ver Opções',
            footerText: 'DentalClinic',
          }),
        });

        return jsonResponse({ ok: true, sent: true, action: "sent_menu" });
      }
    }

    return jsonResponse({ ok: true, action: "no_action" });
  } catch (err: any) {
    console.error("[WEBHOOK ERROR]:", err.message);
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
});