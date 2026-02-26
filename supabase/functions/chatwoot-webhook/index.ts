// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log("[chatwoot-webhook] Nova requisição recebida.");
  if (req.method === "OPTIONS") {
    console.log("[chatwoot-webhook] Requisição OPTIONS, respondendo OK.");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-ignore: Deno namespace
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const payload = await req.json();
    console.log("[chatwoot-webhook] Payload recebido:", JSON.stringify(payload, null, 2));
    
    const { account, conversation: chatwootConversation, content, message_type, contact, attachments } = payload;
    const accountId = account?.id;
    const chatwootConversationId = chatwootConversation?.id;

    if (!accountId || !chatwootConversationId) {
      console.warn("[chatwoot-webhook] account_id ou conversation.id ausente. Ignorando.");
      return new Response("Payload inválido", { status: 400 });
    }
    console.log(`[chatwoot-webhook] Processando para account_id: ${accountId}, conversation_id: ${chatwootConversationId}`);

    // 1. Identificar Clínica
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("*")
      .eq("chatwoot_account_id", accountId)
      .single();

    if (clinicError || !clinic) {
      console.warn(`[chatwoot-webhook] Clínica com account_id ${accountId} não encontrada. Erro: ${clinicError?.message}`);
      return new Response("Clínica não encontrada", { status: 200 });
    }
    console.log(`[chatwoot-webhook] Clínica encontrada: ${clinic.name} (ID: ${clinic.id})`);

    if (message_type === "outgoing") {
      console.log("[chatwoot-webhook] Mensagem 'outgoing', ignorando para evitar loop.");
      return new Response("OK", { status: 200 });
    }

    const phoneNumber = contact?.phone_number?.replace(/[^0-9]/g, "");
    const uazapiNumber = phoneNumber?.startsWith('55') ? phoneNumber : `55${phoneNumber}`;
    console.log(`[chatwoot-webhook] Número de telefone identificado: ${uazapiNumber}`);

    // 2. Encontrar ou criar conversa local
    let { data: localConversation, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("chatwoot_conversation_id", chatwootConversationId)
      .single();

    if (convError && convError.code !== 'PGRST116') {
        console.error("[chatwoot-webhook] Erro ao buscar conversa:", convError);
        throw convError;
    }

    if (!localConversation) {
      console.log(`[chatwoot-webhook] Conversa local não encontrada para chatwoot_conversation_id ${chatwootConversationId}. Criando uma nova.`);
      const { data: patient } = await supabaseAdmin.from("pacientes").select("id").like("telefone", `%${phoneNumber}%`).maybeSingle();
      const { data: newConv, error: newConvError } = await supabaseAdmin
        .from("conversations")
        .insert({
          clinic_id: clinic.id,
          chatwoot_conversation_id: chatwootConversationId,
          patient_id: patient?.id || null,
          status: "open",
        })
        .select("*")
        .single();
      if (newConvError) throw newConvError;
      localConversation = newConv;
      console.log(`[chatwoot-webhook] Nova conversa local criada com ID: ${localConversation.id}`);
    } else {
      console.log(`[chatwoot-webhook] Conversa local encontrada com ID: ${localConversation.id}`);
    }

    // Define o conteúdo da mensagem, tratando anexos
    const messageContent = content || (attachments && attachments.length > 0 ? `[Anexo: ${attachments[0].file_type}]` : '[Mensagem sem texto]');

    // 3. Lógica de Bot (Menu)
    if (localConversation.status === 'open') {
      console.log("[chatwoot-webhook] Conversa está 'open'. Executando lógica de bot.");
      // ... (lógica do menu que já implementamos)
    } else {
      console.log(`[chatwoot-webhook] Conversa com status '${localConversation.status}'. Bot não será executado.`);
    }

    // 4. Salvar Mensagem
    console.log("[chatwoot-webhook] Inserindo nova mensagem no banco...");
    const { error: msgError } = await supabaseAdmin.from("messages").insert({
      clinic_id: clinic.id,
      conversation_id: localConversation.id,
      chatwoot_message_id: payload.id,
      direction: "incoming",
      content: messageContent,
    });
    if (msgError) throw msgError;
    console.log("[chatwoot-webhook] Mensagem inserida com sucesso.");

    // 5. Atualizar Conversa
    console.log("[chatwoot-webhook] Atualizando 'last_message' da conversa...");
    await supabaseAdmin.from("conversations").update({
      last_message: messageContent,
      last_message_at: new Date().toISOString(),
      priority: messageContent.toLowerCase().includes("urgente") ? "urgente" : "normal",
    }).eq("id", localConversation.id);
    console.log("[chatwoot-webhook] Conversa atualizada. Processo finalizado com sucesso.");

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("[chatwoot-webhook] ERRO FATAL:", error.message);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});