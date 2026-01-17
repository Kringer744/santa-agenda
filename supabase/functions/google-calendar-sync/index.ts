// @ts-ignore: Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno environment
import { google } from "https://esm.sh/googleapis@105.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("[google-calendar-sync] Nova requisição recebida.");

  try {
    // SUAS NOVAS CREDENCIAIS FORNECIDAS
    const GOOGLE_CLIENT_ID = "1076641595234-bkhuehgagg5dmj3hl8rsip13aoo0dksh.apps.googleusercontent.com";
    const GOOGLE_CLIENT_SECRET = "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";
    
    // IMPORTANTE: Você precisa gerar um NOVO Refresh Token para estas credenciais acima
    // Substitua a string abaixo pelo novo token gerado
    const GOOGLE_REFRESH_TOKEN = "COLOQUE_AQUI_O_NOVO_REFRESH_TOKEN";

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    const body = await req.json().catch(() => ({}));
    const { action, eventData, calendarId } = body;

    if (!calendarId) {
      console.error("[google-calendar-sync] Erro: calendarId não fornecido.");
      return new Response(JSON.stringify({ error: "calendarId é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[google-calendar-sync] Executando ação: ${action} no calendário: ${calendarId}`);

    let result;
    switch (action) {
      case "createEvent":
        console.log("[google-calendar-sync] Criando evento...", eventData);
        const createRes = await calendar.events.insert({ calendarId, requestBody: eventData });
        result = { success: true, event: createRes.data };
        console.log("[google-calendar-sync] Evento criado com sucesso:", createRes.data.id);
        break;
      
      case "updateEvent":
        if (!eventData?.id) throw new Error("ID do evento ausente para atualização.");
        console.log(`[google-calendar-sync] Atualizando evento ${eventData.id}...`);
        const updateRes = await calendar.events.update({ calendarId, eventId: eventData.id, requestBody: eventData });
        result = { success: true, event: updateRes.data };
        console.log("[google-calendar-sync] Evento atualizado com sucesso.");
        break;
      
      case "deleteEvent":
        if (!eventData?.id) throw new Error("ID do evento ausente para exclusão.");
        console.log(`[google-calendar-sync] Excluindo evento ${eventData.id}...`);
        await calendar.events.delete({ calendarId, eventId: eventData.id });
        result = { success: true };
        console.log("[google-calendar-sync] Evento excluído com sucesso.");
        break;
      
      default:
        throw new Error(`Ação '${action}' não reconhecida.`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("[google-calendar-sync] Erro durante a execução:", error.message);
    if (error.message.includes('invalid_grant')) {
      console.error("[google-calendar-sync] Erro crítico: O Refresh Token expirou ou é inválido para estas credenciais.");
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});