import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

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
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned.startsWith("55")) cleaned = "55" + cleaned;
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

// ============================================================
// ENVIAR MENSAGEM VIA UAZAP (com split inteligente)
// ============================================================
async function sendWhatsAppMessage(apiUrl: string, token: string, number: string, text: string) {
  // Split em blocos de ~350 chars nos parágrafos para UX melhor
  const MAX_BLOCK = 350;
  const paragraphs = text.split("\n\n");
  const blocks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current && (current.length + p.length + 2) > MAX_BLOCK) {
      blocks.push(current.trim());
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current.trim()) blocks.push(current.trim());

  // Se não deu pra splittar ou é curto, manda direto
  if (blocks.length <= 1) {
    return await fetch(`${apiUrl}/send/text`, {
      method: "POST",
      headers: { token, "Content-Type": "application/json" },
      body: JSON.stringify({ number, text }),
    });
  }

  // Manda cada bloco com delay de 1s entre eles
  for (let i = 0; i < blocks.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1000));
    await fetch(`${apiUrl}/send/text`, {
      method: "POST",
      headers: { token, "Content-Type": "application/json" },
      body: JSON.stringify({ number, text: blocks[i] }),
    });
  }
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message ?? {};

    console.log("[WEBHOOK] Body recebido:", JSON.stringify(body));

    // Ignora mensagens enviadas pela própria instância
    if (message?.fromMe) {
      return jsonResponse({ ok: true, message: "Ignored message from self" });
    }

    const rawFrom = body?.chat?.phone ?? message?.sender ?? "";
    if (!rawFrom) {
      return jsonResponse({ ok: true, message: "No sender phone found" });
    }

    const fromNumber = formatPhoneNumber(rawFrom);
    const receivedText = (message?.text ?? "").trim();
    const receivedTextLower = receivedText.toLowerCase();
    const senderName = body?.chat?.name ?? message?.senderName ?? "";

    console.log(`[WEBHOOK] Received from ${fromNumber}: "${receivedText}"`);

    // Carrega config WhatsApp
    const { data: configData, error: configError } = await supabase
      .from("whatsapp_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    const config: WhatsAppMenuConfig | null = configData as WhatsAppMenuConfig | null;

    if (configError || !config?.api_url || !config?.instance_token) {
      console.error("[WEBHOOK] Config inválida:", configError?.message);
      return jsonResponse({ ok: false, error: "Config inválida" }, 500);
    }

    const uazapHeaders = { token: config.instance_token, "Content-Type": "application/json" };
    const menuOptions = ((config.opcoes_menu as WhatsAppMenuOption[]) || []).filter((o) => o.ativo);

    // ---- Buscar/criar conversa ----
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("phone_number", fromNumber)
      .maybeSingle();

    const now = new Date();
    const ATTENDANT_TIMEOUT_MS = 30 * 60 * 1000;

    if (!conversation) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ phone_number: fromNumber, created_at: now.toISOString(), updated_at: now.toISOString() })
        .select()
        .single();
      conversation = newConv;
    } else {
      // Timeout do atendente humano
      if (conversation.is_with_attendant && conversation.last_attendant_message_at) {
        const lastMsg = new Date(conversation.last_attendant_message_at);
        if (now.getTime() - lastMsg.getTime() > ATTENDANT_TIMEOUT_MS) {
          conversation.is_with_attendant = false;
          await supabase
            .from("conversations")
            .update({
              is_with_attendant: false,
              attendant_assigned_at: null,
              last_attendant_message_at: null,
              updated_at: now.toISOString(),
            })
            .eq("phone_number", fromNumber);
        }
      }
    }

    // ---- Comando "reset" ----
    if (receivedTextLower === "reset") {
      await supabase
        .from("conversations")
        .update({
          is_with_attendant: false,
          attendant_assigned_at: null,
          last_attendant_message_at: null,
          updated_at: now.toISOString(),
        })
        .eq("phone_number", fromNumber);

      // Limpar contexto IA
      await supabase.from("ia_conversas").update({ contexto: [], ia_ativa: true, atendente_assumiu: false }).eq("telefone", fromNumber);

      await sendWhatsAppMessage(config.api_url, config.instance_token, fromNumber, "Atendimento automático reativado. Como posso ajudar?");
      return jsonResponse({ ok: true, action: "reset" });
    }

    // ---- Se atendente humano assumiu, não responde ----
    if (conversation?.is_with_attendant) {
      // Salvar mensagem no histórico da conversa
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        content: receivedText,
        sender_type: "patient",
        created_at: now.toISOString(),
      }).catch(() => {}); // Não falha se tabela não existir

      return jsonResponse({ ok: true, message: "Atendente ativo, bot ignorado" });
    }

    // ---- Seleção de opção do menu ----
    const selectedOption = menuOptions.find(
      (o) => o.texto.toLowerCase().trim() === receivedTextLower
    );

    if (selectedOption) {
      console.log(`[WEBHOOK] Opção selecionada: "${selectedOption.texto}"`);

      // Falar com atendente
      if (selectedOption.id === "attendant" || selectedOption.texto.toLowerCase().includes("atendente")) {
        await supabase
          .from("conversations")
          .update({
            is_with_attendant: true,
            attendant_assigned_at: now.toISOString(),
            last_attendant_message_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("phone_number", fromNumber);

        // Desativar IA para essa conversa
        await supabase.from("ia_conversas").update({ atendente_assumiu: true, ia_ativa: false }).eq("telefone", fromNumber);

        await sendWhatsAppMessage(config.api_url, config.instance_token, fromNumber, selectedOption.resposta || "Um atendente vai te responder em breve!");
        return jsonResponse({ ok: true, action: "attendant_requested" });
      }

      // Agendamento
      if (selectedOption.id === "1" || selectedOption.texto.toLowerCase().includes("agendar")) {
        const { data: paciente } = await supabase.from("pacientes").select("id, nome").eq("telefone", fromNumber).maybeSingle();
        const appUrl = Deno.env.get("APP_URL") || "https://preview-ktepifvhpdgexdgvhxpq.lovable.app";
        let link = `${appUrl}/agendamento`;
        let responseText = selectedOption.resposta;

        if (paciente) {
          link += `?paciente_id=${paciente.id}`;
          responseText = `Olá ${paciente.nome}! Para agendar sua consulta, acesse:\n\n${link}`;
        } else {
          responseText = `Para agendar na DentalClinic, acesse:\n\n${link}`;
        }
        await sendWhatsAppMessage(config.api_url, config.instance_token, fromNumber, responseText);
        return jsonResponse({ ok: true, action: "agendamento_link" });
      }

      // Resposta genérica da opção
      await sendWhatsAppMessage(config.api_url, config.instance_token, fromNumber, selectedOption.resposta);
      return jsonResponse({ ok: true, action: "option_response" });
    }

    // ============================================================
    // IA: Tentar responder com IA antes de enviar menu
    // ============================================================
    const { data: iaConfig } = await supabase.from("ia_config").select("ativo").limit(1).maybeSingle();

    if (iaConfig?.ativo) {
      try {
        console.log(`[WEBHOOK] Encaminhando para IA: "${receivedText}"`);

        // Chamar Edge Function ia-responder
        const { data: iaResult, error: iaError } = await supabase.functions.invoke("ia-responder", {
          body: {
            telefone: fromNumber,
            mensagem: receivedText,
            nome_contato: senderName,
          },
        });

        if (!iaError && iaResult?.success && iaResult?.resposta) {
          console.log(`[WEBHOOK] IA respondeu (${iaResult.intent}): "${iaResult.resposta.substring(0, 100)}..."`);

          // Enviar resposta da IA
          await sendWhatsAppMessage(config.api_url, config.instance_token, fromNumber, iaResult.resposta);

          // Salvar mensagem recebida no histórico
          await supabase.from("whatsapp_messages").insert({
            tipo: "ia_resposta",
            destinatario: fromNumber,
            mensagem: iaResult.resposta,
            status: "enviada",
          }).catch(() => {});

          return jsonResponse({ ok: true, action: "ia_response", intent: iaResult.intent, modelo: iaResult.modelo });
        }

        // IA não conseguiu responder (desativada, sem key, erro)
        console.log("[WEBHOOK] IA não respondeu, fallback para menu:", iaResult?.reason || iaError?.message);
      } catch (iaErr: any) {
        console.error("[WEBHOOK] Erro ao chamar IA:", iaErr.message);
        // Continua para o fallback (menu)
      }
    }

    // ============================================================
    // FALLBACK: Enviar menu se IA não respondeu
    // ============================================================

    // Anti-spam
    if (conversation?.last_menu_sent_at) {
      const lastMenu = new Date(conversation.last_menu_sent_at);
      if (now.getTime() - lastMenu.getTime() < 10_000) {
        return jsonResponse({ ok: true, message: "Anti-spam ativo" });
      }
    }

    if (config.menu_ativo && menuOptions.length > 0) {
      const welcomeMsg = config.mensagem_boas_vindas || "Olá! Seja bem-vindo à DentalClinic.";
      const choices = ["[Opções]", ...menuOptions.map((o) => `${o.texto}|${o.id}|`)];

      await fetch(`${config.api_url}/send/menu`, {
        method: "POST",
        headers: uazapHeaders,
        body: JSON.stringify({
          number: fromNumber,
          type: "list",
          text: welcomeMsg,
          choices,
          listButton: config.list_button_text || "Ver Opções",
          footerText: config.footer_text || "DentalClinic",
        }),
      });

      await supabase
        .from("conversations")
        .update({ last_menu_sent_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("phone_number", fromNumber);

      return jsonResponse({ ok: true, action: "sent_menu" });
    }

    return jsonResponse({ ok: true, action: "no_action" });
  } catch (err: any) {
    console.error("[WEBHOOK ERROR]:", err.message);
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
});
