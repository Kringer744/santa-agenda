// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // @ts-ignore: Deno namespace
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const payload = await req.json();
    console.log("[chatwoot-webhook] Payload recebido:", JSON.stringify(payload, null, 2));

    const { account, conversation: chatwootConversation, content, message_type, contact } = payload;
    const accountId = account?.id;
    const chatwootConversationId = chatwootConversation?.id;

    if (!accountId || !chatwootConversationId) {
      console.warn("[chatwoot-webhook] account_id ou conversation.id ausente. Ignorando.");
      return new Response("Payload inválido", { status: 400 });
    }

    // 1. Encontrar a clínica pelo account_id
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("id")
      .eq("chatwoot_account_id", accountId)
      .single();

    if (clinicError || !clinic) {
      console.warn(`[chatwoot-webhook] Clínica com account_id ${accountId} não encontrada. Ignorando.`);
      return new Response("Clínica não configurada", { status: 200 });
    }

    const clinicId = clinic.id;
    const phoneNumber = contact?.phone_number?.replace(/[^0-9]/g, "");

    // 2. Encontrar ou criar o paciente
    let patientId = null;
    if (phoneNumber) {
      const { data: patient } = await supabaseAdmin
        .from("pacientes")
        .select("id")
        .like("telefone", `%${phoneNumber}%`)
        .maybeSingle();
      
      if (patient) {
        patientId = patient.id;
      } else {
        // Cria um paciente provisório
        const { data: newPatient } = await supabaseAdmin
          .from("pacientes")
          .insert({
            nome: contact?.name || `Paciente ${phoneNumber}`,
            telefone: phoneNumber,
            cpf: `TEMP_${phoneNumber}`, // CPF temporário para satisfazer a constraint
            tags: ['chatwoot-prospect']
          })
          .select("id")
          .single();
        if (newPatient) patientId = newPatient.id;
      }
    }

    // 3. Encontrar ou criar a conversa local
    let { data: localConversation } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("chatwoot_conversation_id", chatwootConversationId)
      .single();

    if (!localConversation) {
      const { data: newConversation, error: newConvError } = await supabaseAdmin
        .from("conversations")
        .insert({
          clinic_id: clinicId,
          chatwoot_conversation_id: chatwootConversationId,
          patient_id: patientId,
          status: "open",
          priority: content?.toLowerCase().includes("urgente") ? "urgente" : "normal",
          last_message: content,
          last_message_at: new Date().toISOString(),
          channel: "whatsapp",
        })
        .select("id")
        .single();
      
      if (newConvError) throw newConvError;
      localConversation = newConversation;
    }

    if (!localConversation) {
      throw new Error("Falha ao encontrar ou criar a conversa local.");
    }

    // 4. Inserir a mensagem
    const { error: messageError } = await supabaseAdmin.from("messages").insert({
      clinic_id: clinicId,
      conversation_id: localConversation.id,
      chatwoot_message_id: payload.id,
      direction: message_type === "incoming" ? "incoming" : "outgoing",
      content: content,
      status: "sent",
    });

    if (messageError) throw messageError;

    // 5. Atualizar a conversa com a última mensagem
    const { error: updateConvError } = await supabaseAdmin
      .from("conversations")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        status: "open", // Sempre reabre a conversa ao receber nova mensagem
        priority: content?.toLowerCase().includes("urgente") ? "urgente" : "normal",
        patient_id: patientId, // Atualiza caso o paciente tenha sido encontrado/criado
      })
      .eq("id", localConversation.id);

    if (updateConvError) throw updateConvError;

    console.log(`[chatwoot-webhook] Mensagem da conversa ${chatwootConversationId} processada para a clínica ${clinicId}.`);
    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("[chatwoot-webhook] Erro:", error.message);
    return new Response(`Webhook Error: ${error.message}`, { status: 500 });
  }
});