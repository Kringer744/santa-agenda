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
  // IMPORTANT: This URL is dynamic. In a production environment, this should be a stable domain.
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
      console.error("[WEBHOOK] Erro ao carregar configuração do WhatsApp do Supabase:", configError.message);
      return jsonResponse({ ok: false, error: "Erro ao carregar configuração do WhatsApp" }, 500);
    }
    if (!config) {
      console.warn("[WEBHOOK] Configuração do WhatsApp não encontrada na tabela 'whatsapp_config'.");
      // If no config, we can't do anything, but it's not an error for the webhook itself.
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

    const menuOptions = (config.opcoes_menu as any as MenuOption[]) || [];
    const activeMenuOptions = menuOptions.filter(o => o.ativo);

    // --- NOVA LÓGICA: Lidar com a seleção de uma opção do menu primeiro ---
    const selectedOption = activeMenuOptions.find(option => 
      option.texto.toLowerCase().trim() === receivedText
    );

    if (selectedOption) {
      console.log(`[WEBHOOK] Usuário selecionou a opção do menu: "${selectedOption.texto}"`);
      let responseText = selectedOption.resposta;

      // Tratamento especial para a opção "Agendar uma consulta"
      if (selectedOption.id === '1' || selectedOption.texto.toLowerCase().includes('agendar uma consulta')) {
        const { data: paciente } = await supabase
          .from('pacientes')
          .select('id, nome')
          .eq('telefone', fromNumber)
          .maybeSingle();

        let link = `${APP_URL}/client-appointment`;
        if (paciente) {
          link += `?paciente_id=${paciente.id}`;
          responseText = `Olá ${paciente.nome}! Que bom te ver novamente. Para agendar sua nova consulta, use este link exclusivo:\n\n${link}`;
        } else {
          responseText = `Olá! Para agendar sua consulta na DentalClinic, acesse o link abaixo:\n\n${link}\n\nSelecione o dentista e o melhor horário para você.`;
        }
      }

      try {
        const sendTextResponse = await fetch(`${uazapApiUrl}/send/text`, {
          method: "POST",
          headers: uazapHeaders,
          body: JSON.stringify({ number: fromNumber, text: responseText }),
        });

        const sendTextData = await sendTextResponse.json().catch(async () => ({ raw: await sendTextResponse.text() }));
        console.log("[WEBHOOK] Resposta da opção do menu enviada do UAZAP:", sendTextData);

        if (!sendTextResponse.ok) {
          console.error("[WEBHOOK] Falha ao enviar resposta da opção do menu via UAZAP:", sendTextData);
          return jsonResponse({ ok: false, error: "Falha ao enviar resposta da opção do menu", uazap_response: sendTextData }, 502);
        }
      } catch (fetchError: any) {
        console.error("[WEBHOOK] Erro de rede durante o fetch para resposta da opção do menu:", fetchError.message);
        return jsonResponse({ ok: false, error: `Erro de rede ao enviar resposta da opção do menu: ${fetchError.message}` }, 500);
      }
      return jsonResponse({ ok: true, sent: true, action: "sent_menu_option_response" });
    }

    // --- LÓGICA ANTIGA: Enviar menu inicial se nenhuma opção específica foi selecionada e o menu estiver ativo ---
    // Este bloco só deve ser executado se o usuário enviar uma mensagem geral e não uma seleção de menu.
    if (config.menu_ativo) {
      const welcomeMessage = config.mensagem_boas_vindas || 'Olá! 🦷 Seja bem-vindo à nossa Clínica Odontológica. Como podemos cuidar do seu sorriso hoje?';
      
      const choices: string[] = [
        '[Atendimento]', // Seção principal
        ...activeMenuOptions.map(o => `${o.texto}|${o.id}|${o.resposta.substring(0, 72)}`)
      ];

      if (choices.length > 1) { // Garante que há pelo menos uma opção real além do cabeçalho da seção
        console.log(`[WEBHOOK] Enviando menu interativo para: ${fromNumber}`);
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
          console.log("[WEBHOOK] Resposta do menu enviada do UAZAP:", menuData);

          if (!menuResponse.ok) {
            console.error("[WEBHOOK] Falha ao enviar menu interativo via UAZAP:", menuData);
            return jsonResponse({ ok: false, error: "Falha ao enviar menu interativo", uazap_response: menuData }, 502);
          }
        } catch (fetchError: any) {
          console.error("[WEBHOOK] Erro de rede durante o fetch para menu interativo:", fetchError.message);
          return jsonResponse({ ok: false, error: `Erro de rede ao enviar menu interativo: ${fetchError.message}` }, 500);
        }

        return jsonResponse({ ok: true, sent: true, action: "sent_interactive_menu" });
      } else {
        console.warn("[WEBHOOK] Nenhuma opção de menu ativa para enviar.");
      }
    }

    // Se nenhuma das condições acima for atendida, retorna ok sem ação específica
    console.log("[WEBHOOK] Nenhuma ação específica tomada para a mensagem.");
    return jsonResponse({ ok: true, action: "no_specific_action_taken" });
  } catch (err: any) {
    console.error("[WEBHOOK ERROR] Erro não tratado:", err.message);
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
});