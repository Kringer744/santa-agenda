import { supabase } from "@/integrations/supabase/client";

export const chatwootService = {
  async sendMessage(clinicId: string, chatwootConversationId: number, content: string) {
    // Buscamos as credenciais da clínica
    const { data: clinic } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (!clinic) throw new Error("Clínica não encontrada");

    const response = await fetch(`${clinic.chatwoot_base_url}/api/v1/accounts/${clinic.chatwoot_account_id}/conversations/${chatwootConversationId}/messages`, {
      method: 'POST',
      headers: {
        'api_access_token': clinic.chatwoot_api_token || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        message_type: "outgoing"
      })
    });

    return response.json();
  },

  async resolveConversation(clinicId: string, chatwootConversationId: number) {
    const { data: clinic } = await supabase.from('clinics').select('*').eq('id', clinicId).single();
    if (!clinic) throw new Error("Clínica não encontrada");

    await fetch(`${clinic.chatwoot_base_url}/api/v1/accounts/${clinic.chatwoot_account_id}/conversations/${chatwootConversationId}`, {
      method: 'POST',
      headers: {
        'api_access_token': clinic.chatwoot_api_token || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: "resolved" })
    });
  }
};