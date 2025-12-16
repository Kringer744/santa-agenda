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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    console.log("[WEBHOOK] Received:", JSON.stringify(body));

    // UAZAPI envia eventos com diferentes estruturas; adapte conforme necessário
    // Estrutura comum: { event, data: { ... } } ou diretamente { from, text, ... }
    const event = body?.event ?? body?.type ?? "message";
    const msgData = body?.data ?? body;

    // Número do remetente (lead). Exemplos: body.data.from, body.sender, body.chatid
    const rawFrom = msgData?.from ?? msgData?.sender ?? msgData?.chatid ?? "";
    // Remove sufixos @s.whatsapp.net / @c.us se existirem
    const fromNumber = rawFrom.replace(/@.+$/, "").replace(/\D/g, "");

    if (!fromNumber) {
      console.log("[WEBHOOK] Sem número de origem, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

    // Ignorar mensagens enviadas por nós mesmos
    if (msgData?.fromMe === true) {
      console.log("[WEBHOOK] Mensagem enviada por mim, ignorando.");
      return jsonResponse({ ok: true, skipped: true });
    }

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

    // Montar menu em texto
    const activeOptions = opcoes.filter((o: any) => o.ativo !== false);
    const menuLines = activeOptions.map((o: any, idx: number) => `• ${idx + 1} - ${o.texto || o.label || "Opção"}`);
    const finalText = `${welcomeMessage}\n\n${menuLines.join("\n")}\n\nResponda com o número da opção.`;

    console.log("[WEBHOOK] Enviando menu para:", fromNumber);

    // Enviar via UAZAP
    const sendResp = await fetch(`${apiUrl}/send/text`, {
      method: "POST",
      headers: {
        token: instanceToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number: fromNumber, text: finalText }),
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
