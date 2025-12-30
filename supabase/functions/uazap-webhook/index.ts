import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const ONE_HOUR_MS = 60 * 60 * 1000;

// Formatar número de telefone para formato brasileiro
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return jsonResponse({ ok: true, service: "uazap-webhook-clinic" }); // Updated service name
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://localhost:8080";

  try {
    const body = await req.json();
    console.log("[WEBHOOK] Received:", JSON.stringify(body));

    const eventType = body?.EventType ?? body?.event ?? body?.type ?? "";
    
    if (eventType !== "messages") {
      console.log("[WEBHOOK] Evento ignorado (não é mensagem):", eventType);
      return jsonResponse({ ok: true, skipped: true, reason: "not_message_event" });
    }

    const chat = body?.chat ?? {};
    const message = body?.message ?? {};

    if (message?.fromMe === true) {
      console.log("[WEBHOOK] Mensagem enviada por mim, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    if (chat?.wa_isGroup === true || message?.isGroup === true) {
      console.log("[WEBHOOK] Mensagem de grupo, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    let rawFrom = chat?.phone ?? chat?.wa_chatid ?? message?.chatid ?? message?.sender ?? "";
    const fromNumber = formatPhoneNumber(rawFrom);

    if (!fromNumber) {
      console.log("[WEBHOOK] Sem número de origem válido, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    console.log("[WEBHOOK] Processando mensagem de:", fromNumber);

    // Buscar config
    const { data: configRow, error: cfgErr } = await supabase
      .from('whatsapp_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (cfgErr) {
      console.error("[WEBHOOK] Erro ao buscar config:", cfgErr);
      return jsonResponse({ ok: false, error: cfgErr.message }, 500);
    }

    if (!configRow) {
      console.log("[WEBHOOK] Sem config, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    const menuAtivo = configRow.menu_ativo === true;
    const apiUrl = configRow.api_url;
    const instanceToken = configRow.instance_token;
    const welcomeMessage = configRow.mensagem_boas_vindas ?? "";
    const opcoes = Array.isArray(configRow.opcoes_menu) ? configRow.opcoes_menu : [];

    const receivedMessageText = message?.text?.toLowerCase().trim();
    const selectedOption = opcoes.find((o: any) => o.id === receivedMessageText);

    if (selectedOption && selectedOption.id === '1') { // Opção "🗓️ Agendar uma consulta"
      console.log("[WEBHOOK] Opção 'Agendar uma consulta' selecionada.");

      // Buscar paciente pelo telefone
      const { data: paciente, error: pacienteError } = await supabase
        .from('pacientes') // Changed table name
        .select('id, nome')
        .eq('telefone', fromNumber)
        .maybeSingle();

      if (pacienteError) {
        console.error("[WEBHOOK] Erro ao buscar paciente:", pacienteError);
        return jsonResponse({ ok: false, error: pacienteError.message }, 500);
      }

      if (!paciente) {
        // Se não encontrar o paciente, envia link para cadastro de paciente
        const registrationLink = `${APP_BASE_URL}/client-registration`; // Consider creating a client-registration page
        const responseText = "Parece que você ainda não está cadastrado. Por favor, crie seu perfil de paciente aqui:\n\n" + registrationLink;
        await fetch(`${apiUrl}/send/text`, {
          method: "POST",
          headers: { token: instanceToken, "Content-Type": "application/json" },
          body: JSON.stringify({ number: fromNumber, text: responseText }),
        });
        return jsonResponse({ ok: true, messageSent: true, reason: "paciente_not_found" });
      }

      // Se paciente encontrado, envia link para agendamento
      const appointmentLink = `${APP_BASE_URL}/client-appointment?paciente_id=${paciente.id}`; // Updated link
      const responseText = `Olá ${paciente.nome}! Para agendar sua consulta, acesse o link abaixo:\n\n${appointmentLink}\n\nSelecione o dentista, data e horário.`;

      await fetch(`${apiUrl}/send/text`, {
        method: "POST",
        headers: { token: instanceToken, "Content-Type": "application/json" },
        body: JSON.stringify({ number: fromNumber, text: responseText }),
      });

      return jsonResponse({ ok: true, appointmentLinkSent: true });
    }

    if (!menuAtivo) {
      console.log("[WEBHOOK] Menu não está ativo, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    // Buscar ou criar conversa
    let { data: conversa, error: convErr } = await supabase
      .from("whatsapp_conversas")
      .select("*")
      .eq("telefone", fromNumber)
      .maybeSingle();

    const now = new Date();

    if (!conversa) {
      // Criar nova conversa
      const { data: newConv, error: insertErr } = await supabase
        .from("whatsapp_conversas")
        .insert({
          telefone: fromNumber,
          atendente_assumiu: false,
          ultima_mensagem_at: now.toISOString(),
          menu_enviado_at: null,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("[WEBHOOK] Erro ao inserir conversa:", insertErr);
        return jsonResponse({ ok: false, error: insertErr.message }, 500);
      }

      conversa = newConv;
    } else {
      // Atualizar ultima_mensagem_at
      await supabase
        .from("whatsapp_conversas")
        .update({ ultima_mensagem_at: now.toISOString() })
        .eq("id", conversa.id);
    }

    const atendenteAssumiu = conversa.atendente_assumiu === true;
    const menuEnviadoAt = conversa.menu_enviado_at ? new Date(conversa.menu_enviado_at).getTime() : 0;
    const msSinceMenuSent = now.getTime() - menuEnviadoAt;

    const deveEnviarMenu = !atendenteAssumiu && (menuEnviadoAt === 0 || msSinceMenuSent > ONE_HOUR_MS);

    if (!deveEnviarMenu) {
      console.log("[WEBHOOK] Não é necessário enviar menu:", { atendenteAssumiu, msSinceMenuSent });
      return jsonResponse({ ok: true, skipped: true });
    }

    const activeOptions = opcoes.filter((o: any) => o.ativo !== false);
    
    const choices: string[] = [
      "[Atendimento]",
      ...activeOptions.map((o: any) => {
        const texto = o.texto || o.label || "Opção";
        const id = o.id || "opt";
        const desc = (o.resposta || o.description || "").substring(0, 72);
        return `${texto}|${id}|${desc}`;
      }),
    ];

    console.log("[WEBHOOK] Enviando menu para:", fromNumber);

    const sendResp = await fetch(`${apiUrl}/send/menu`, {
      method: "POST",
      headers: {
        token: instanceToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: fromNumber,
        type: "list",
        text: welcomeMessage,
        choices,
        listButton: "Menu de Atendimento",
        footerText: "DentalClinic", // Updated footer
      }),
    });

    const sendResult = await sendResp.json().catch(() => ({}));
    console.log("[WEBHOOK] Resultado envio:", sendResult);

    await supabase
      .from("whatsapp_conversas")
      .update({ menu_enviado_at: now.toISOString() })
      .eq("id", conversa.id);

    return jsonResponse({ ok: true, menuSent: true, sendResult });
  } catch (error) {
    console.error("[WEBHOOK] Erro:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return jsonResponse({ ok: false, error: message }, 500);
  }
});