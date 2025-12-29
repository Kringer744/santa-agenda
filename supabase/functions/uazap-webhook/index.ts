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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Healthcheck (útil para testar a URL do webhook no navegador e no painel UAZAPI)
  if (req.method === "GET") {
    return jsonResponse({ ok: true, service: "uazap-webhook" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    console.log("[WEBHOOK] Received:", JSON.stringify(body));

    // UAZAPI envia eventos com estrutura: { EventType, chat, message, ... }
    const eventType = body?.EventType ?? body?.event ?? body?.type ?? "";
    
    // Só processar eventos de mensagem
    if (eventType !== "messages") {
      console.log("[WEBHOOK] Evento ignorado (não é mensagem):", eventType);
      return jsonResponse({ ok: true, skipped: true, reason: "not_message_event" });
    }

    const chat = body?.chat ?? {};
    const message = body?.message ?? {};

    // Ignorar mensagens enviadas por nós mesmos
    if (message?.fromMe === true) {
      console.log("[WEBHOOK] Mensagem enviada por mim, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    // Ignorar mensagens de grupos
    if (chat?.wa_isGroup === true || message?.isGroup === true) {
      console.log("[WEBHOOK] Mensagem de grupo, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    // Extrair número do remetente da estrutura UAZAPI
    // Prioridade: chat.phone > chat.wa_chatid > message.chatid > message.sender
    let rawFrom = chat?.phone ?? chat?.wa_chatid ?? message?.chatid ?? message?.sender ?? "";
    
    // Remove sufixos @s.whatsapp.net / @c.us / @lid e caracteres não numéricos
    const fromNumber = rawFrom.replace(/@.+$/, "").replace(/\D/g, "");

    if (!fromNumber) {
      console.log("[WEBHOOK] Sem número de origem válido, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    console.log("[WEBHOOK] Processando mensagem de:", fromNumber);

    // Buscar config
    const { data: configRow, error: cfgErr } = await supabase
      .from("whatsapp_config")
      .select("*")
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

    // Verificar se a mensagem recebida é uma resposta a uma opção do menu
    const receivedMessageText = message?.text?.toLowerCase().trim();
    const selectedOption = opcoes.find((o: any) => o.id === receivedMessageText);

    if (selectedOption && selectedOption.id === '1') { // Opção "Reservar hospedagem para meu pet"
      console.log("[WEBHOOK] Opção 'Reservar hospedagem' selecionada.");

      // Buscar tutor pelo telefone
      const { data: tutor, error: tutorError } = await supabase
        .from('tutores')
        .select('id, nome')
        .eq('telefone', fromNumber)
        .maybeSingle();

      if (tutorError) {
        console.error("[WEBHOOK] Erro ao buscar tutor:", tutorError);
        return jsonResponse({ ok: false, error: tutorError.message }, 500);
      }

      if (!tutor) {
        // Se não encontrar o tutor, pode pedir para ele se cadastrar ou enviar um link genérico
        const responseText = "Parece que você ainda não está cadastrado. Por favor, cadastre-se primeiro ou entre em contato com nosso atendimento.";
        await fetch(`${apiUrl}/send/text`, {
          method: "POST",
          headers: { token: instanceToken, "Content-Type": "application/json" },
          body: JSON.stringify({ number: fromNumber, text: responseText }),
        });
        return jsonResponse({ ok: true, messageSent: true, reason: "tutor_not_found" });
      }

      // Buscar pets do tutor
      const { data: pets, error: petsError } = await supabase
        .from('pets')
        .select('id, nome, especie')
        .eq('tutor_id', tutor.id);

      if (petsError) {
        console.error("[WEBHOOK] Erro ao buscar pets:", petsError);
        return jsonResponse({ ok: false, error: petsError.message }, 500);
      }

      if (!pets || pets.length === 0) {
        const responseText = `Olá ${tutor.nome}! Você ainda não tem pets cadastrados. Por favor, cadastre seu pet no nosso sistema ou entre em contato com nosso atendimento.`;
        await fetch(`${apiUrl}/send/text`, {
          method: "POST",
          headers: { token: instanceToken, "Content-Type": "application/json" },
          body: JSON.stringify({ number: fromNumber, text: responseText }),
        });
        return jsonResponse({ ok: true, messageSent: true, reason: "no_pets_found" });
      }

      // Por simplicidade, vamos pegar o primeiro pet. Em um cenário real, você pode listar os pets e pedir para o cliente escolher.
      const firstPet = pets[0];
      // TODO: Substitua 'https://seu-app.com' pela URL do seu app
      const reservationLink = `https://seu-app.com/client-reservation?tutor_id=${tutor.id}&pet_id=${firstPet.id}`; 
      const responseText = `Olá ${tutor.nome}! Para reservar a hospedagem do seu pet ${firstPet.nome} (${firstPet.especie === 'cachorro' ? '🐶' : '🐱'}), acesse o link abaixo:\n\n${reservationLink}\n\nSelecione as datas e finalize sua reserva.`;

      await fetch(`${apiUrl}/send/text`, {
        method: "POST",
        headers: { token: instanceToken, "Content-Type": "application/json" },
        body: JSON.stringify({ number: fromNumber, text: responseText }),
      });

      return jsonResponse({ ok: true, reservationLinkSent: true });
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

    // Verificar se deve enviar o menu:
    // 1) Atendente não assumiu
    // 2) Nunca enviou menu OU enviou há mais de 1 hora
    const atendenteAssumiu = conversa.atendente_assumiu === true;
    const menuEnviadoAt = conversa.menu_enviado_at ? new Date(conversa.menu_enviado_at).getTime() : 0;
    const msSinceMenuSent = now.getTime() - menuEnviadoAt;

    const deveEnviarMenu = !atendenteAssumiu && (menuEnviadoAt === 0 || msSinceMenuSent > ONE_HOUR_MS);

    if (!deveEnviarMenu) {
      console.log("[WEBHOOK] Não é necessário enviar menu:", { atendenteAssumiu, msSinceMenuSent });
      return jsonResponse({ ok: true, skipped: true });
    }

    // Montar menu no formato UAZAPI list
    const activeOptions = opcoes.filter((o: any) => o.ativo !== false);
    
    // Formato: "[Seção]", "Título|id|Descrição"
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

    // Enviar via UAZAP usando /send/menu com type: list
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
        footerText: "Hotel para Pets",
      }),
    });

    const sendResult = await sendResp.json().catch(() => ({}));
    console.log("[WEBHOOK] Resultado envio:", sendResult);

    // Atualizar menu_enviado_at
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