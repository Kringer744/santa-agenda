// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // @ts-ignore: Deno namespace
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const payload = await req.json();
    
    const { account, conversation: chatwootConversation, content, message_type, contact } = payload;
    const accountId = account?.id;
    const chatwootConversationId = chatwootConversation?.id;

    if (!accountId || !chatwootConversationId) return new Response("Payload inválido", { status: 400 });

    // 1. Identificar Clínica
    const { data: clinic } = await supabaseAdmin
      .from("clinics")
      .select("*")
      .eq("chatwoot_account_id", accountId)
      .single();

    if (!clinic) return new Response("Clínica não encontrada", { status: 200 });

    // Ignorar mensagens enviadas pelo sistema (outgoing) para evitar loops de bot
    if (message_type === "outgoing") return new Response("OK", { status: 200 });

    const phoneNumber = contact?.phone_number?.replace(/[^0-9]/g, "");

    // 2. Encontrar ou criar conversa local
    let { data: localConversation } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("chatwoot_conversation_id", chatwootConversationId)
      .single();

    if (!localConversation) {
      // Tenta vincular paciente
      const { data: patient } = await supabaseAdmin.from("pacientes").select("id").like("telefone", `%${phoneNumber}%`).maybeSingle();
      
      const { data: newConv } = await supabaseAdmin
        .from("conversations")
        .insert({
          clinic_id: clinic.id,
          chatwoot_conversation_id: chatwootConversationId,
          patient_id: patient?.id || null,
          status: "open",
          priority: content?.toLowerCase().includes("urgente") ? "urgente" : "normal",
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      localConversation = newConv;
    }

    // 3. Lógica de Bot (Menu) - Só executa se NÃO estiver com atendente
    if (localConversation.status !== 'pending' && localConversation.status !== 'resolved') {
      const receivedText = content?.toLowerCase().trim();

      // Se o usuário pediu atendente ou opção 8
      if (receivedText.includes("atendente") || receivedText === "8") {
        const protocol = Math.floor(Math.random() * 100000);
        const responseText = `Olá! Seu protocolo é ${protocol}.\n\nFique tranquilo(a), estamos te encaminhando para um atendente agora mesmo. 😊`;
        
        // Enviar mensagem via Chatwoot
        await fetch(`${clinic.chatwoot_base_url}/api/v1/accounts/${clinic.chatwoot_account_id}/conversations/${chatwootConversationId}/messages`, {
          method: 'POST',
          headers: { 'api_access_token': clinic.chatwoot_api_token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: responseText, message_type: "outgoing" })
        });

        // Transferir no Chatwoot (Team ID 6 conforme n8n)
        await fetch(`${clinic.chatwoot_base_url}/api/v1/accounts/${clinic.chatwoot_account_id}/conversations/${chatwootConversationId}/assignments`, {
          method: 'POST',
          headers: { 'api_access_token': clinic.chatwoot_api_token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ team_id: 6 })
        });

        // Marcar como pendente (bloqueio do bot)
        await supabaseAdmin.from("conversations").update({ status: "pending", updated_at: new Date().toISOString() }).eq("id", localConversation.id);
      } 
      // Se for uma mensagem nova e não for resposta de menu, envia o menu
      else if (!receivedText.includes("[lista]")) {
        const menuText = "Olá! Seja bem-vindo(a) à DentalClinic!\n\nPara te ajudar rapidamente, escolha uma das opções:\n\n1. Endereço\n2. Horário\n3. Especialidades\n4. Convênios\n8. Falar com atendente";
        
        await fetch(`${clinic.chatwoot_base_url}/api/v1/accounts/${clinic.chatwoot_account_id}/conversations/${chatwootConversationId}/messages`, {
          method: 'POST',
          headers: { 'api_access_token': clinic.chatwoot_api_token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: menuText, message_type: "outgoing" })
        });
      }
    }

    // 4. Salvar Mensagem no Banco
    await supabaseAdmin.from("messages").insert({
      clinic_id: clinic.id,
      conversation_id: localConversation.id,
      chatwoot_message_id: payload.id,
      direction: "incoming",
      content: content,
    });

    // 5. Atualizar Conversa
    await supabaseAdmin.from("conversations").update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      priority: content?.toLowerCase().includes("urgente") ? "urgente" : "normal",
    }).eq("id", localConversation.id);

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("[chatwoot-webhook] Erro:", error.message);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});