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
    if (message?.fromMe) return jsonResponse({ ok: true, message: "Ignored message from self" });

    const rawFrom = body?.chat?.phone ?? message?.sender ?? "";
    if (!rawFrom) return jsonResponse({ ok: true, message: "No sender phone found" });

    const fromNumber = formatPhoneNumber(rawFrom);
    const receivedText = (message?.text ?? "").toLowerCase().trim();

    // Carrega a configuração do WhatsApp
    const { data: config, error: configError } = await supabase.from('whatsapp_config').select('*').limit(1).maybeSingle();
    if (configError) {
      console.error("[WEBHOOK] Erro ao carregar configuração do WhatsApp do Supabase:", configError.message);
      return jsonResponse({ ok: false, error: "Erro ao carregar configuração do WhatsApp" }, 500);
    }
    if (!config) {
      console.warn("[WEBHOOK] Configuração do WhatsApp não encontrada na tabela 'whatsapp_config'.");
      return jsonResponse({ ok: true, message: "No WhatsApp config found" });
    }

    const uazapApiUrl = config.api_url;
    const uazapInstanceToken = config.instance_token;

    // Verifica se as credenciais do UAZAP estão configuradas
    if (!uazapApiUrl || !uazapInstanceToken) {
      console.error("[WEBHOOK] URL da API UAZAP ou Token da Instância não configurados na tabela whatsapp_config.");
      return jsonResponse({ ok: false, error: "UAZAP API URL or Instance Token missing in config" }, 400);
    }

    const uazapHeaders = {
      token: uazapInstanceToken,
      "Content-Type": "application/json",
    };

    // Lógica para agendamento via menu ou texto (prioritária)
    if (receivedText === "1" || receivedText.includes("agendar")) {
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('id, nome')
        .eq('telefone', fromNumber)
        .maybeSingle();

      let link = `${APP_URL}/client-appointment`;
      let text = `Olá! Para agendar sua consulta na DentalClinic, acesse o link abaixo:\n\n${link}\n\nSelecione o dentista e o melhor horário para você.`;

      if (paciente) {
        link += `?paciente_id=${paciente.id}`;
        text = `Olá ${paciente.nome}! Que bom te ver novamente. Para agendar sua nova consulta, use este link exclusivo:\n\n${link}`;
      }

      console.log(`[WEBHOOK] Sending appointment link to: ${fromNumber}`);
      try {
        const sendTextResponse = await fetch(`${uazapApiUrl}/send/text`, {
          method: "POST",
          headers: uazapHeaders,
          body: JSON.stringify({ number: fromNumber, text }),
        });

        const sendTextData = await sendTextResponse.json().catch(async () => ({ raw: await sendTextResponse.text() }));
        console.log("[WEBHOOK] Appointment link sent response from UAZAP:", sendTextData);

        if (!sendTextResponse.ok) {
          console.error("[WEBHOOK] Failed to send appointment link via UAZAP:", sendTextData);
          return jsonResponse({ ok: false, error: "Failed to send appointment link", uazap_response: sendTextData }, 502); // Bad Gateway
        }
      } catch (fetchError: any) {
        console.error("[WEBHOOK] Network error during fetch for appointment link:", fetchError.message);
        return jsonResponse({ ok: false, error: `Network error sending appointment link: ${fetchError.message}` }, 500);
      }

      return jsonResponse({ ok: true, sent: true, action: "sent_appointment_link" });
    }

    // Lógica para enviar menu interativo se ativo e nenhuma ação específica foi tomada
    if (config.menu_ativo) {
      const welcomeMessage = config.mensagem_boas_vindas || 'Olá! 🦷 Seja bem-vindo à nossa Clínica Odontológica. Como podemos cuidar do seu sorriso hoje?';
      const menuOptions = (config.opcoes_menu as any as MenuOption[]) || [];

      const activeOptions = menuOptions.filter(o => o.ativo);
      const choices: string[] = [
        '[Atendimento]', // Seção principal
        ...activeOptions.map(o => `${o.texto}|${o.id}|${o.resposta.substring(0, 72)}`)
      ];

      if (choices.length > 1) { // Garante que há pelo menos uma opção real além do cabeçalho da seção
        console.log(`[WEBHOOK] Sending interactive menu to: ${fromNumber}`);
        try {
          const menuResponse = await fetch(`${uazapApiUrl}/send/menu`, {
            method: "POST",
            headers: uazapHeaders,
            body: JSON.stringify({
              number: fromNumber,
              type: "list",
              text: welcomeMessage,
              choices,
              listButton: 'Menu de Atendimento',
              footerText: 'DentalClinic',
            }),
          });

          const menuData = await menuResponse.json().catch(async () => ({ raw: await menuResponse.text() }));
          console.log("[WEBHOOK] Menu sent response from UAZAP:", menuData);

          if (!menuResponse.ok) {
            console.error("[WEBHOOK] Failed to send interactive menu via UAZAP:", menuData);
            return jsonResponse({ ok: false, error: "Failed to send interactive menu", uazap_response: menuData }, 502); // Bad Gateway
          }
        } catch (fetchError: any) {
          console.error("[WEBHOOK] Network error during fetch for interactive menu:", fetchError.message);
          return jsonResponse({ ok: false, error: `Network error sending interactive menu: ${fetchError.message}` }, 500);
        }

        return jsonResponse({ ok: true, sent: true, action: "sent_interactive_menu" });
      } else {
        console.warn("[WEBHOOK] Nenhuma opção de menu ativa para enviar.");
      }
    }

    // Se nenhuma das condições acima for atendida, retorna ok sem ação específica
    return jsonResponse({ ok: true, action: "no_specific_action_taken" });
  } catch (err: any) {
    console.error("[WEBHOOK ERROR] Unhandled error:", err.message);
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
});